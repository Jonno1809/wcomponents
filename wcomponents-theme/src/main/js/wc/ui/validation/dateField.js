define(["wc/date/interchange",
	"wc/date/getDifference",
	"wc/dom/attribute",
	"wc/dom/event",
	"wc/dom/initialise",
	"wc/dom/shed",
	"wc/i18n/i18n",
	"wc/ui/dateField",
	"wc/ui/validation/validationManager",
	"lib/sprintf",
	"wc/ui/validation/isComplete",
	"wc/ui/feedback"],
	function(interchange, getDifference, attribute, event, initialise, shed, i18n, dateField, validationManager, sprintf, isComplete, feedback) {
		"use strict";
		/**
		 * @constructor
		 * @alias module:wc/ui/validation/dateField~ValidationDateInput
		 * @private
		 */
		function ValidationDateInput() {
			/**
			 * A descriptor for a WDateField.
			 * @see {@link module:wc/ui/dateField#getWidget}.
			 * @var {Widget}
			 * @private
			 */
			var DATE_FIELD = dateField.getWidget();

			/**
			 * Array filter function which checks if a date is within the future/past constraint (if any).
			 * @function
			 * @private
			 * @param {Element} element A WDateField
			 * @returns {boolean} true if constraint not met; false if constraints met, no constraints or date field is empty
			 */
			function isDateInvalid(element) {
				var invalid = false,
					date, flag, value,
					textbox,
					comparisonDate,
					LABEL_PLACEHOLDER = "%s",
					minAttrib = "data-wc-min",
					maxAttrib = "data-wc-max";

				if (dateField.isReadOnly(element) || !(textbox = dateField.getTextBox(element)) || dateField.getPartialDateWidget().isOneOfMe(textbox)) {
					return false;  // do not apply constraint validation to read-only or partial date fields, even if the date entered is a full date.
				}

				if ((value = dateField.getValue(element)) && !validationManager.isExempt(element)) {
					if (textbox.getAttribute("type") === "date") {
						minAttrib = "min";
						maxAttrib = "max";
					}

					date = interchange.toDate(value);
					/*
					 * There are a set of very unusual circumstances which can cause the change and close calls to
					 * acceptFirstMatch to fail. These involve concurrent use of the keyboard and mouse along with
					 * strategic defocusing of the document whilst not losing focus of the window. Odd but true. This
					 * double up just makes sure that if there is any input into the input element then we make every
					 * effort to convert it to a value we can understand.
					 */
					if (!date) {
						dateField.acceptFirstMatch(textbox);
						value = dateField.getValue(textbox);
						date = interchange.toDate(value);
					}

					if (date) {
						if ((comparisonDate = textbox.getAttribute(minAttrib))) {
							comparisonDate = interchange.toDate(comparisonDate);
							if (getDifference(date, comparisonDate) < 0) {
								invalid = true;
								comparisonDate = comparisonDate.toLocaleDateString();
								flag = i18n.get("validation_date_undermin");
								// manipulate flag to replace the numbered string placeholders (so it ends up in the same format as the other flags)
								flag = sprintf.sprintf(flag, LABEL_PLACEHOLDER, comparisonDate);
							}
						}
						if ((comparisonDate = textbox.getAttribute(maxAttrib))) {
							comparisonDate = interchange.toDate(comparisonDate);
							if (getDifference(date, comparisonDate) > 0) {
								invalid = true;
								comparisonDate = comparisonDate.toLocaleDateString();
								flag = i18n.get("validation_date_overmax");
								// manipulate flag to replace the numbered string placeholders (so it ends up in the same format as the other flags)
								flag = sprintf.sprintf(flag, LABEL_PLACEHOLDER, comparisonDate);
							}
						}
					} else {
						// a full date field can only be valid if a full date is entered and getDateFromElement will return ""
						flag = i18n.get("validation_date_incomplete");
						invalid = true;
					}
				}
				if (invalid) {
					feedback.flagError({element: element, message: sprintf.sprintf(flag, validationManager.getLabelText(element))});
				}
				return invalid;
			}

			/**
			 * Message formatting function. Used by the function validate.
			 * @function
			 * @private
			 * @param {Element} element The element in an invalid state.
			 * @returns {String} The formatted validation message.
			 */
			function messageFunction(element) {
				var textbox = dateField.getTextBox(element);
				return sprintf.sprintf(i18n.get("validation_common_incomplete"), validationManager.getLabelText(textbox));
			}

			/**
			 * Determines if a date field is 'valid' for client side validation. A WDateField is valid
			 * if it meets the following criteria:
			 * <ol>
			 *  <li>If the WDateField is mandatory then the WDateField has content</li>
			 *  <li>If the WDateField has content then it is able to be parsed to a date</li>
			 *  <li>If the WDateField has min and/or max constraints and has content then the content is within the
			 *      expected range.</li></ol>
			 * <p><strong>NOTE:</strong> will always return TRUE for a partial date field to prevent date validation problems.</p>
			 * @function
			 * @private
			 * @param {Element} container The element being validated, a form, container or WDateField
			 * @returns {boolean} true if the WDateField is valid
			 */
			function validate(container) {
				var valid = true,
					invalid,
					candidates,
					incomplete = [],
					complete = true;

				if (dateField.isOneOfMe(container, true)) {
					candidates = [container];
				} else {
					candidates = DATE_FIELD.findDescendants(container);
				}
				Array.prototype.forEach.call(candidates, function(next) {
					var textBox;
					if (dateField.isReadOnly(next)) {
						return;
					}
					if (dateField.isLameDateField(next)) {
						if (!next.getAttribute("aria-required")) {
							return;
						}
						if (!dateField.getValue(next)) {
							incomplete.push(next);
						}
					} else {
						textBox = dateField.getTextBox(next);
						if (!textBox.getAttribute("required")) {
							return;
						}
						if (!textBox.value) {
							incomplete.push(next);
						}
					}
				});

				if (incomplete.length) {
					complete = false;

					incomplete.forEach(function(next) {
						feedback.flagError({element: next, message: messageFunction(next)});
					});
				}

				if (dateField.isOneOfMe(container, true)) {
					valid = dateField.isReadOnly(container) || !isDateInvalid(container);
				} else {
					invalid = Array.prototype.filter.call(candidates, isDateInvalid, this);
					if (invalid && invalid.length) {
						valid = false;
					}
				}
				return complete && valid;
			}

			/**
			 * Change event handler. This is attached to body in browsers which capture and bubble change events and
			 * directly to each WDateField's input element when the element is first focused otherwise.
			 * @function
			 * @private
			 * @param {wc/dom/event} $event The wrapped change event as published by the WComponent event manager
			 */
			function changeEvent($event) {
				var element = DATE_FIELD.findAncestor($event.target);
				if (element) {
					if (validationManager.isValidateOnChange()) {
						if (validationManager.isInvalid(element)) {
							validationManager.revalidationHelper(element, validate);
							return;
						}
						validate(element);
						return;
					}
					validationManager.revalidationHelper(element, validate);
				}
			}

			function blurEvent($event) {
				var element = DATE_FIELD.findAncestor($event.target);
				if (element && shed.isMandatory(element)) {
					validate(element);
				}
			}

			/**
			 * Focus event handler used to lazily attach a change event listener to a WDateField when first focused.
			 * @function
			 * @private
			 * @param {Event} $event the wrapped focus/focusin event as published by the WComponent event manager.
			 */
			function focusEvent($event) {
				var element = $event.target,
					BOOTSTRAPPED = "validation.dateField.bs";
				if (!$event.defaultPrevented && dateField.isOneOfMe(element, false) && !attribute.get(element, BOOTSTRAPPED)) {
					attribute.set(element, BOOTSTRAPPED, true);
					event.add(element, event.TYPE.change, changeEvent, 1);
					if (validationManager.isValidateOnBlur()) {
						if (event.canCapture) {
							event.add(element, event.TYPE.blur, blurEvent, 1, null, true);
						} else {
							event.add(element, event.TYPE.focusout, blurEvent);
						}
					}
				}
			}

			/**
			 * @function module:wc/ui/validation/dateField.initialise
			 * @public
			 * @param {Element} element The element being initialised.
			 */
			this.initialise = function(element) {
				if (event.canCapture) {
					event.add(element, event.TYPE.focus, focusEvent, 1, null, true);
				} else {
					event.add(element, event.TYPE.focusin, focusEvent, 1);
				}
			};


			/**
			 * Determines if a WDateField is 'complete'. A date input is complete is it has content without attempting
			 * to determine if the content is a valid date.
			 * @function
			 * @private
			 * @param {Element} element A WDateField.
			 * @returns {boolean} true if element is complete.
			 */
			function isCompleteHelper(element) {
				var textbox = dateField.getTextBox(element),
					iAmComplete = false;
				if (textbox && textbox.value) {
					iAmComplete = true;
				}
				return iAmComplete;
			}

			/**
			 * Subscriber function for {@link ./isComplete} to test the completeness of a container.
			 * @function
			 * @private
			 * @param {Element} container The form, subform or date field we are testing for completeness.
			 * @returns {boolean} true if container is complete.
			 */
			function isCompleteSubscriber(container) {
				return isComplete.isCompleteHelper(container, DATE_FIELD, isCompleteHelper);
			}

			/**
			 * Late initialisation function to set up dateField validation.
			 * TODO: move initialisation here, do we need the change listeners so early?
			 * @function module:wc/ui/validation/dateField.postInit
			 * @public
			 */
			this.postInit = function() {
				isComplete.subscribe(isCompleteSubscriber);
				validationManager.subscribe(validate);
			};
		}

		/**
		 * Provides functionality to undertake client validation of WDateField.
		 *
		 * @module
		 * @requires wc/date/interchange
		 * @requires wc/date/getDifference
		 * @requires wc/dom/attribute
		 * @requires wc/dom/event
		 * @requires wc/dom/initialise
		 * @requires wc/i18n/i18n
		 * @requires wc/ui/dateField
		 * @requires wc/ui/validation/validationManager
		 * @requires external:lib/sprintf
		 * @requires wc/ui/validation/isComplete
		 * @requires wc/ui/feedback
		 */
		var instance = new ValidationDateInput();
		initialise.register(instance);
		return instance;
	});
