<template>
  <div class="MatcWidgetDragNDrop"></div>
</template>
<script>
import DojoWidget from "dojo/DojoWidget";
import css from "dojo/css";
import lang from "dojo/_base/lang";
import on from "dojo/on";
import touch from "dojo/touch";
import domGeom from "dojo/domGeom";
import domStyle from "dojo/domStyle";
import win from "dojo/_base/win";
import Logger from "common/Logger";
import UIWidget from "core/widgets/UIWidget";

import {cssGetPxValue} from 'core/utils/generics'

export default {
  name: "DragNDrop",
  mixins: [UIWidget, DojoWidget],
  data: function() {
    return {
      value: null,
      dndX: true,
      dndY: true
    };
  },
  components: {},
  methods: {
    postCreate: function() {
      this.log = new Logger("DragNDrop");
      this._borderNodes = [this.domNode];
      this._backgroundNodes = [this.domNode];
      this._shadowNodes = [this.domNode];
      this._paddingNodes = [this.domNode];
      this.log.log(4, "postrCreate", "enter");
    },

    wireEvents: function() {
      this.own(
        this.addTouchStart(this.domNode, lang.hitch(this, "onDndStart"))
      );

      this.own(
        on(this.domNode, touch.over, lang.hitch(this, "onDomMouseOver"))
      );
      this.own(on(this.domNode, touch.out, lang.hitch(this, "onDomMouseOut")));
    },

    getLabelNode: function() {
      return this.domNode;
    },

    onDndStart: function(e) {
      this.stopEvent(e);
      this.emitClick(e);
      this.cleanUp();
      this.initDnd();

      css.add(this.domNode, "MatcWidgetDragNDropMove");

      this.dndStartPos = this.getMouse(e);

      //this.moveListener = on(win.body(),touch.move, lang.hitch(this,"onDnDMove"));
      //this.releaseListener = on(win.body(),touch.release, lang.hitch(this,"onDndEnd"));

      this.moveListener = this.addTouchMove(win.body(),lang.hitch(this, "onDnDMove"));
      this.releaseListener = this.addTouchRelease(win.body(),lang.hitch(this, "onDndEnd"));

      this.initCompositeState(this.value);

      if (this.model.active) {
        //this.emitAnimation(this.model.id, 0, this.model.active);
      }
    },

    initDnd: function() {
      if (!this.containerSize) {
        if (this.domNode.parentNode.parentNode) {
          this.containerSize = domGeom.position(
            this.domNode.parentNode.parentNode
          );
          this.log.log( 4,"onDndStart",  "enter " + this.containerSize.w + " " + this.containerSize.h);
        } else {
          console.warn("No container node!");
        }
      }
      if (!this.dndParentPos) {
        this.dndParentPos = this.getCanvasPosition(this.domNode.parentNode);
        this.log.log( 4, "onDndStart", "dom " + this.dndParentPos.x + "," + this.dndParentPos.y );
      }
    },

    onDnDMove: function(e) {
      this.stopEvent(e);
      var pos = this.getMouse(e);
      this.emitMouseMove(e, true);
      var delta = {
        x: 0,
        y: 0
      };
      if (this.dndX) {
        delta.x = Math.round(pos.x - this.dndStartPos.x);
      }
      if (this.dndY) {
        delta.y = Math.round(pos.y - this.dndStartPos.y);
      }
      this.dndCurrentDelta = delta;
      // Fixme: requestAnimationFrame works slow on android..
      this.renderPosition();
    },

    renderPosition: function() {
      if (this.dndCurrentDelta) {
        this.updateValue(this.dndCurrentDelta);
        this.addCompositeSubState(this.value);
      }
      delete this.dndCurrentDelta;
    },

    onDndEnd: function(e) {
      this.stopEvent(e);
      this.emitCompositeState("dnd", this.value);
      this.cleanUp();
      this.dndParentPos = this._lastDndPositon;
    },

    updateValue: function(value) {
      if (this.containerSize) {
        /**
         * Do some bounds checking...
         */
        var x = this.dndParentPos.x + value.x;
        var y = this.dndParentPos.y + value.y;

        if (x + this.model.w > this.containerSize.w) {
          x = this.containerSize.w - this.model.w;
        }
        if (x < 0) {
          x = 0;
        }

        if (y + this.model.h > this.containerSize.h) {
          y = this.containerSize.h - this.model.h;
        }
        if (y < 0) {
          y = 0;
        }
        /**
         * save relative position
         */
        var newValue = {
          x: x / this.containerSize.w,
          y: y / this.containerSize.h
        };
        this.setValue(newValue);
      } else {
        console.warn("No container Size");
      }
    },

    /**
     * returns the current position
     */
    getValue: function() {
      return this.value;
    },

    /**
     * set the current position
     */
    setValue: function(value) {
      if (value) {
        this.initDnd();
        this.value = value;

        if (this.containerSize) {
          if (!this.posReset) {
            if (this.dndX) {
              this.domNode.parentNode.style.left = "0";
            }
            if (this.dndY) {
              this.domNode.parentNode.style.top = "0";
            }
            this.posReset = true;
          }
          // transformOrigin = 0% 0%
          if (this.dndX && !this.dndY) {
            let trans = "translateX(" + value.x * this.containerSize.w + "px)";
            this.domNode.parentNode.style.transform = trans;
            this.domNode.parentNode.style.webkitTransform = trans;
          } else if (this.dndY && !this.dndX) {
            let trans = "translateY(" + value.y * this.containerSize.h + "px)";
            this.domNode.parentNode.style.transform = trans;
            this.domNode.parentNode.style.webkitTransform = trans;
          } else {
            let trans = "translate(" + value.x * this.containerSize.w + "px," + value.y * this.containerSize.h + "px)";
            this.domNode.parentNode.style.transform = trans;
            this.domNode.parentNode.style.webkitTransform = trans;
          }

          this._lastDndPositon = {
            x: value.x * this.containerSize.w,
            y: value.y * this.containerSize.h
          };
        } else {
          console.warn("setValue() > No container...");
        }

        //this.domNode.parentNode.style.top = value.y*100 +"%";
        //this.domNode.parentNode.style.left = value.x*100 + "%";
      }
    },

    getState: function() {
      return {
        type: "pos",
        value: this.value
      };
    },

    setState: function(state, t) {
      if (state && state.type == "pos") {
        this.setValue(state.value);
      }
      if (state && state.type == "dnd") {
        var substate = this.getLastSubState(state, t);
        if (substate) {
          var value = substate.value;
          this.setValue(value);
        }
      }
    },

    cleanUp: function() {
      if (this.moveListener) {
        this.moveListener.remove();
      }

      if (this.releaseListener) {
        this.releaseListener.remove();
      }

      delete this.moveListener;
      delete this.releaseListener;
      delete this.dndStartPos;
      css.remove(this.domNode, "MatcWidgetDragNDropMove");

      if (this.model.active) {
        //this.emitAnimation(this.model.id, 0, this.model.style);
      }
    },

    render: function(model, style, scaleX, scaleY) {
      this.model = model;

      this.style = style;
      this._scaleX = scaleX;
      this._scaleY = scaleY;
      this.setStyle(style, model);
      if (model.props.label) {
        this.domNode.innerHTML = model.props.label;
      }

      if (this.model.props) {
        this.dndX = this.model.props.dndX;
        this.dndY = this.model.props.dndY;
      }
    },

    getCanvasPosition: function(node) {
      var s = domStyle.get(node);
      return {
        x: cssGetPxValue(s.left),
        y: cssGetPxValue(s.top)
      };
    },

    beforeDestroy: function() {
      if (this._compositeState) {
        this.emitCompositeState();
      }
      this.cleanUp();
    }
  },
  mounted() {}
};
</script>