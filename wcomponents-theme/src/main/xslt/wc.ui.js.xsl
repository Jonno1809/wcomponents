<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ui="https://github.com/bordertech/wcomponents/namespace/ui/v1.0" 
	xmlns:html="http://www.w3.org/1999/xhtml" version="2.0">

	<xsl:template match="ui:js"/>

	<xsl:template match="ui:js" mode="inHead">
		<script type="text/javascript" src="{@url}" async="async"></script>
	</xsl:template>
</xsl:stylesheet>
