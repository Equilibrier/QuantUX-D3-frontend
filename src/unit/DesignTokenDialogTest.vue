<template>
  <div class="MatcLight">
    <h1 style="margin-left:20px; margin-bottom:20px;">DesignTokenDialog Test</h1>


   <div class="MatcDialogBack MatcDialog MatcDesignTokenDialog MatcPadding" style="background: #fff;display:inline-block; vertical-align: top; margin-left:30px;">
        <DesignTokenDialog @change="onChange" ref="dialog"/>
    </div>

  </div>
</template>

<style>
  @import url("../style/matc.css");
  .MatcDataSettings {
      background: white;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
      padding:20px;
  }
</style>

<script>

import DesignTokenDialog from 'canvas/toolbar/dialogs/DesignTokenDialog'
import designToken1 from './data/designToken1.json'

import DIProvider from 'core/di/DIProvider';

export default {
  name: "DataSettingsTest",
  mixins: [],
  data: function() {
    return {
      waiting: true

    };
  },
  components: {
    DesignTokenDialog: DesignTokenDialog
  },
  computed: {
  },
  methods: {
      onChange (d) {
          this.settings = JSON.stringify(d, null, 2)
      }
  },
  mounted() {
    this.$refs.dialog.setModel(designToken1)
    DIProvider.setModel(designToken1);
    this.$refs.dialog.setValue()

  }
};
</script>
