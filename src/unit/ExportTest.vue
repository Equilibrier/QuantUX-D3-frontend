<template>
  <div class="MatcLight">
    <h1>Git Test</h1>

   <div class="">
      <ExportDialog ref="dialog"/>
    </div>
  </div>
</template>

<style>
  @import url("../style/matc.css");
  .MatcDialog {
      box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.2), 0px 0px 2px rgba(0, 0, 0, 0.2);
      overflow: auto;
      margin: 10px;
      background: #fff;
  }
</style>

<style lang="sass">
  @import "../style/bulma.sass"
</style>


<script>


import Logger from '../core/Logger'
import ExportDialog from 'canvas/toolbar/dialogs/ExportDialog'
import app from './data/export_snack.json'
import Services from 'services/Services'

import DIProvider from 'core/di/DIProvider';

export default {
  name: "FigmaTest",
  mixins: [],
  data: function() {
    return {

    };
  },
  components: {
    'ExportDialog': ExportDialog
  },
  computed: {

  },
  methods: {

  },
  mounted() {
    Logger.setLogLevel(4)
    this.$refs.dialog.setJwtToken(Services.getUserService().getToken())
    app.lastUpdate = new Date().getTime()
    this.$refs.dialog.setModel(app)
    DIProvider.setModel(app);
  }
};
</script>
