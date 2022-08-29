
<template>
     <div class="MatchImportDialog MatchExportDialog MatcDialog">

        <div class="MatcToolbarTabs MatcToolbarTabsBig">
            <a @click="showImageExport()"             :class="{'MatcToolbarTabActive': tab === 'images'}">{{ getNLS('dialog.export.tab-images')}}</a>
            <a @click="tab='github'" v-if="hasGit"    :class="{'MatcToolbarTabActive': tab === 'github'}">{{ getNLS('dialog.export.tab-github')}}</a>
            <a @click="tab='zip'"                     :class="{'MatcToolbarTabActive': tab === 'zip'}">{{ getNLS('dialog.export.tab-zip')}}</a>
            <a @click="showDomsExport()"   :class="{'MatcToolbarTabActive': tab === 'reactjs-cmdd-no-logic'}">{{ getNLS('dialog.export.tab-react-nologic')}}</a>
            <a @click="tab='reactjs-cmdd-MVVM-logic'" :class="{'MatcToolbarTabActive': tab === 'reactjs-cmdd-MVVM-logic'}">{{ getNLS('dialog.export.tab-react-mvvmlogic')}}</a>
        </div>
        <div v-if="isPublic">
             <div class="MatchImportDialogCntr">
             {{ getNLS('dialog.import.error-public')}}
            </div>
        </div>

        <div v-else class="MatcExportDialogCntr">
            <div v-show="tab=== 'images'" ref="imageCntr">
            </div>

            <div v-show="tab=== 'reactjs-cmdd-no-logic'" ref="rnlCntr">
            </div>

             <div v-show="tab=== 'github'">
                <!-- <ExportGit :model="model" :jwtToken="jwtToken" ref="exportGit" /> -->
            </div>

            <div v-show="tab=== 'zip'">
                <ExportZip :model="model" :jwtToken="jwtToken" ref="exportZip" />
            </div>
        </div>

        <div class="MatcError">
            {{errorMSG}}
        </div>

        <div class=" MatcButtonBar MatcMarginTop">
            <a class=" MatcButton" v-if="tab === 'github'" @click.stop="onExport">{{ getNLS('btn.export')}}</a>
            <a class=" MatcButton" @click.stop="onCancel">{{ getNLS('btn.close')}}</a>
        </div>



	</div>
</template>
<style lang="scss">
    @import '../../../style/import_dialog.scss';
    @import '../../../style/export_dialog.scss';
</style>
<script>
import DojoWidget from 'dojo/DojoWidget'
import Logger from 'common/Logger'
import Util from 'core/Util'
import ExportImages from './ExportImages'
//import ExportGit from './ExportGit'
import ExportZip from './ExportZip'
import ExportDoms from './ExportDoms'

import DIProvider from '../../../core/di/DIProvider'

export default {
    name: 'GitExport',
    mixins:[Util, DojoWidget],
    data: function () {
        return {
            hasGit: false,
            tab: "zip",
            zoom: 1,
            errorMSG: '',
            progressMSG: '',
            model: null,
            jwtToken: '',
            isPublic: false,
            width: 150,
            height: 150
        }
    },
    components: {
      //'ExportGit': ExportGit,
      'ExportZip': ExportZip
    },
    computed: {
    },
    methods: {
        showImageExport () {
          this.tab = 'images'
          if (this.downloader) {
            this.downloader.onFocus()
          }
        },

        showDomsExport() {
          this.tab = 'reactjs-cmdd-no-logic'
          if (this.renderer) {
            console.log(`evr1: start generating doms`)
            this.renderer.onFocus()

            let s = null
            for (let id in this.model.screens) {
              const screen = this.model.screens[id];
              if (screen.name === "MMenu") {
                s = screen
                break
              }
            }
            if (s) {
              const sdiv = DIProvider.simulatorRef().renderScreen(s, 0)
              console.error(`scr div: ${sdiv}, ${JSON.stringify(sdiv)}`)
              this.renderer.cntr.appendChild(sdiv)
				      this.renderer.renderCntr.appendChild(sdiv)
              const el = document.createElement('div')
              el.innerHTML = "BLAH"
              this.renderer.renderCntr.appendChild(el)
            }
          }
        },

        setModel (m){
          this.model = m;

          this.downloader = this.$new(ExportImages);
          this.downloader.setJwtToken(this.jwtToken);
          this.downloader.placeAt(this.$refs.imageCntr);
          this.downloader.setModel(m);
          if (this.tab === 'images') {
            setTimeout(() => {
              this.downloader.onFocus()
            }, 30)
          }

          console.log(`evr1: creating doms renderer`)
          this.renderer = this.$new(ExportDoms);
          this.renderer.setJwtToken(this.jwtToken);
          this.renderer.placeAt(this.$refs.rnlCntr);
          this.renderer.setModel(m);
          if (this.tab === 'reactjs-cmdd-no-logic') {
            console.log(`evr1: start generating doms`)
            setTimeout(() => {
              this.renderer.onFocus()
            }, 30)
          }
        },

        setPublic (isPublic) {
          this.isPublic = isPublic
        },

        setJwtToken(t) {
          this.jwtToken = t
        },

        setZoom (z) {
          this.zoom = z
        },

        onCancel () {
          if (this.downloader) {
            this.downloader.cleanUp()
          }
          this.emit('cancel')
        },

        async onExport () {
          if (this.tab === 'images') {
            this.errorMSG = "Press on the images to download"
          }

          if (this.tab === 'github') {
            this.errorMSG = ""
            this.$refs.exportGit.writeToGit()
          }
        }
    },
    mounted () {
        this.logger = new Logger("ExportDialog");
    }
}
</script>