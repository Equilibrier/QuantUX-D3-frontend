<template>
  <div class="MatcLight">
    <h1>Import Test</h1>
    <div class="MatcDialog MatchImportDialog MatcPadding">
      <ImportDialog ref="importDialog"/>
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

import ImportDialog from 'canvas/toolbar/dialogs/ImportDialog'
import app from './data/export_snack.json'

import DIProvider from 'core/di/DIProvider';

export default {
  name: "FigmaTest",
  mixins: [],
  data: function() {
    return {
        files: [],
        previews: [],
        model: null,
        accessKey: '',
    };
  },
  components: {
    'ImportDialog': ImportDialog
  },
  computed: {
    screens () {
      if (this.model) {
        return Object.values(this.model.screens)
      }
      return null
    },
    width () {
      if (this.model) {
        return this.model.screenSize.w + 'px'
      }
      return 0
    },
    height () {
      if (this.model) {
        return this.model.screenSize.h + 'px'
      }
      return 0
    }
  },
  methods: {
      getPreview() {
      },
      onSelect (d) {
          this.selection = d
      },
      setAccessKey () {
        localStorage.setItem('quxFigmaTest', this.accessKey)
      },
      async run() {

      }
  },
  mounted() {
    this.$refs.importDialog.setModel(app)
    DIProvider.setModel(app);
    this.$refs.importDialog.setJwtToken('lalal')
  }
};
</script>
