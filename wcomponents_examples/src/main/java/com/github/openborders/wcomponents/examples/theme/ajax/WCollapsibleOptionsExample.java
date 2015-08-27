package com.github.openborders.wcomponents.examples.theme.ajax;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

import com.github.openborders.wcomponents.Action;
import com.github.openborders.wcomponents.ActionEvent;
import com.github.openborders.wcomponents.HeadingLevel;
import com.github.openborders.wcomponents.Request;
import com.github.openborders.wcomponents.WButton;
import com.github.openborders.wcomponents.WCheckBox;
import com.github.openborders.wcomponents.WCollapsible;
import com.github.openborders.wcomponents.WContainer;
import com.github.openborders.wcomponents.WDropdown;
import com.github.openborders.wcomponents.WFieldLayout;
import com.github.openborders.wcomponents.WFieldSet;
import com.github.openborders.wcomponents.WHorizontalRule;
import com.github.openborders.wcomponents.WLabel;
import com.github.openborders.wcomponents.WRadioButtonSelect;
import com.github.openborders.wcomponents.WText;
import com.github.openborders.wcomponents.WCollapsible.CollapsibleMode;

/**
 * This example provides the configuration options on the {@link WCollapsible} class.
 *
 * @author Steve Harney
 * @since 1.0.0
 */
public class WCollapsibleOptionsExample extends WContainer
{
    /** The radio button select for collapsible modes.*/
    private final WRadioButtonSelect rbCollapsibleSelect;

    /** The check box for the initial state of the collapsible. */
    private final WCheckBox cbCollapsed = new WCheckBox(true);

    /** The check box if the collapsible is visible or not.*/
    private final WCheckBox cbVisible = new WCheckBox(true);
    
    /** The check box if the collapsible is visible or not.*/
    private final WDropdown drpHeadingLevels = new WDropdown();
    
    /** The container for holding the example. */
    private final WContainer container = new WContainer();

    /**
     * constructor.
     */
    public WCollapsibleOptionsExample()
    {
        // configuration layouts.
        WFieldSet fieldSet = new WFieldSet("Collapsible configuration");
        WFieldLayout layout = new WFieldLayout(WFieldLayout.LAYOUT_STACKED);
        rbCollapsibleSelect = new WRadioButtonSelect(WCollapsible.CollapsibleMode.values());
        rbCollapsibleSelect.setButtonLayout(WRadioButtonSelect.LAYOUT_FLAT);
        rbCollapsibleSelect.setSelected(WCollapsible.CollapsibleMode.LAZY);
        rbCollapsibleSelect.setFrameless(true);
        layout.addField("Collapsible Mode", rbCollapsibleSelect);
        layout.addField("Heading level", drpHeadingLevels);
        layout.addField("Collapsed", cbCollapsed);
        layout.addField("Visible", cbVisible);
        
        List<HeadingLevel> levels = new ArrayList<HeadingLevel>(Arrays.asList(HeadingLevel.values()));
        levels.add(0, null);
        drpHeadingLevels.setOptions(levels);

        // Apply Button
        WButton apply = new WButton("Apply");
        apply.setAction(new Action()
        {
            @Override
            public void execute(final ActionEvent event)
            {
                applySettings();
            }
        });
        layout.addField((WLabel)null, apply);
        fieldSet.add(layout);

        add(fieldSet);
        add(new WHorizontalRule());
        add(container);

    }

    /**
     * applySettings creates the WCollapsible, and loads it into the
     * container.
     */
    private void applySettings()
    {
        // reset the container.
        container.reset();

        // create the new collapsible.
        WText component1 = new WText("Here is some text that is collapsible via ajax.");
        WCollapsible collapsible1 = new WCollapsible(component1, "Collapsible",
                                                     (CollapsibleMode) rbCollapsibleSelect.getSelected());
        collapsible1.setCollapsed(cbCollapsed.isSelected());
        collapsible1.setVisible(cbVisible.isSelected());
        
        if(collapsible1.getMode()==CollapsibleMode.DYNAMIC)
        {
                component1.setText(component1.getText()+ "\u00a0Generated on " + new Date());
        }
        
        if (drpHeadingLevels.getSelected() != null)
        {
            collapsible1.setHeadingLevel((HeadingLevel) drpHeadingLevels.getSelected());
        }
        
        // add the new collapsible to the container.
        container.add(collapsible1);

    }

    /**
     * preparePaintComponent is called to use the applySettings to configure the collapsible.
     *
     * @param request the web request.
     */
    @Override
    protected void preparePaintComponent(final Request request)
    {
        super.preparePaintComponent(request);

        if (!isInitialised())
        {
            applySettings();
            setInitialised(true);
        }
    }
}