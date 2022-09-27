
<template>
    <div class="">
		<div class="" data-dojo-attach-point="cntr">
		</div>
		<div class="MatcDownloadDialogRender" data-dojo-attach-point="renderCntr"></div>
	</div>
</template>
<script>
import DojoWidget from 'dojo/DojoWidget'
import Logger from 'common/Logger'
import DomBuilder from 'common/DomBuilder'
import Preview from 'page/Preview'

import Simulator from 'core/Simulator'
import ModelUtil from 'core/ModelUtil'

export default {
    name: 'ExportDoms',
    mixins:[DojoWidget],
    data: function () {
        return {
            width: 150,
            height: 150
        }
    },
    components: {},
    methods: {

			setModel (m){
				this.doms = {}
				this.model = m;
				this.height = (m.screenSize.h /  m.screenSize.w) * this.width;
			},

			setJwtToken(t) {
				this.jwtToken = t
			},

			onFocus () {
				this.logger.log(-1, "onFocus", "enter");
				/**
				 * Rerender stuff
				 */
				this.cntr.innerHTML = ""
				this.renderCntr.innerHTML = ""
				this.render(this.model);
			},

			async render (model) {
				this.wrappers = {};
				this.previews = {};
				for (let id in model.screens) {
					let screen = model.screens[id];
					let wrapper = this.db
						.div("MatcToolbarScreenListPreviewWrapper MatcCreateBtnElement MatcToolbarDropDownButtonItem")
						.div("MatcDownloadDialogPreview")
						.w(this.width)
						.h(this.height)
						.build(this.cntr);
					this.wrappers[id] = wrapper;
					this.db.span("", "Loading...").build(wrapper);
					this.renderScreen(model, screen);
				}
			},

			renderScreen2(model, screen) {
				var prev = this.$new(Preview);
				// prev.placeAt(wrapper);
				prev.setJwtToken(this.jwtToken);
				//prev.setModel(model, screen.id);
				//prev.setScreenPos({w:800, h:600});
				prev.setModel(model);
				prev.setScreen(screen.id);

				// this.doms[screen.id] = s.domNode

				// this.cntr.appendChild(s.domNode)
				// this.renderCntr.appendChild(s.domNode)
				return prev.domNode
			},

			renderScreen3(screen) {
				var s = this.$new(Simulator,{mode : "debug", logData : false});
				s.scrollListenTarget = "parent";
				s.isDesktopTest = true
				//s.setHash(this.hash)
				
				// var prev = this.$new(Preview);
				// // prev.placeAt(wrapper);
				// prev.setJwtToken(this.jwtToken);
				// //prev.setModel(model, screen.id);
				// //prev.setScreenPos({w:800, h:600});
				// prev.setModel(model);
				// prev.setScreen(screen.id);

				// // this.doms[screen.id] = s.domNode

				// // this.cntr.appendChild(s.domNode)
				// // this.renderCntr.appendChild(s.domNode)
				// return prev.domNode

				const _scaleX = 3.0
				const _scaleY = 3.0

				console.log(`screenModel: ${JSON.stringify(screen)}`)
				console.log(`model expandat2?: ${JSON.stringify(this.model)}`)
				let model = s.createZoomedModel(_scaleX, _scaleY, true, this.model)
				model = ModelUtil.inlineTemplateStyles(model)

				s.renderFactory.setModel(model)
				s.renderFactory.setScaleFactor(_scaleX, _scaleY)
				
				s.startScreenID = screen.id
				const div = s.render()
				return div
			},

			renderScreen (model, screen) {
				this.logger.log(0, "download", "enter > " + screen.id + " > f:" + f);
				var f = 2;

				/**
				 * On focus this method might be called again, do not render twice
				 */
				if (this.doms[screen.id]) {
					return
				}

				try {
					var db = new DomBuilder();
					var cntrNode = db.div("MatcDownloaderCntr").build(this.renderCntr);
					var wrapper = db.div("MatcDownloaderWrapper")
							.w(screen.w * f).h(screen.h * f)
							.build(cntrNode);

					this.previews[screen.id] = cntrNode;

					var s = this.$new(Preview);
					s.placeAt(wrapper);
					s.setJwtToken(this.jwtToken);
					//s.setModel(model, screen.id);
					
					this.doms[screen.id] = s.domNode

					
					this.wrappers[screen.id].innerHTML = "";
					// this.db.span("", "123").build(this.wrappers[screen.id]);
					// this.db.div("", s.domNode).build(this.wrappers[screen.id])
					this.wrappers[screen.id].appendChild(s.domNode)

					console.error(`computed dom for screen ${screen.name}`)
					//domtoimage.toBlob(s.domNode)
					//		.then(lang.hitch(this, "onBlobReady", screen))
					//		.catch(lang.hitch(this, "onImageError", screen));


				} catch (e) {
					this.logger.error("download", "Something went wrong", e);
					this.logger.sendError(e);
				}

			},

			
			cleanUp () {
				delete this.doms
				delete this.wrappers
			}
    },
    mounted () {
				this.logger = new Logger("ExportDoms");
				this.db = new DomBuilder();
    }
}
</script>