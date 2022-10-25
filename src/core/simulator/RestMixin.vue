<template>
  <div>
  </div>
</template>
<script>

import RestEngine from 'core/RestEngine'
import JSONPath from 'core/JSONPath'

var flatten = require('flat')

export default {
	name: 'RestMixin',
  methods: {
    async executeRest (screenID, widgetID, widget, line) {
      this.logger.log(1,"executeRest","enter >  rest:" + widget.id, line );

      const rest = widget.props.rest
      
      /**
       * get al the data we need!
       */
      const requiredDataBindings = RestEngine.getNeededDataBings(rest)
      let data = {}
      requiredDataBindings.forEach(path => {
        const value = this.getDataBindingByPath(path)
        data[path] = value
      })

      const diff = (obj1, obj2) => {
          if ((!obj1 && obj2) || (obj1 && !obj2)) {
            return obj1 ? obj1 : obj2
          }
          const result = {};
          if (Object.is(obj1, obj2)) {
              return undefined;
          }
          if (!obj2 || typeof obj2 !== 'object') {
              return obj2;
          }
          Object.keys(obj1 || {}).concat(Object.keys(obj2 || {})).forEach(key => {
              if(obj2[key] !== obj1[key] && !Object.is(obj1[key], obj2[key])) {
                  result[key] = obj2[key];
              }
              if(typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
                  const value = diff(obj1[key], obj2[key]);
                  if (value !== undefined) {
                      result[key] = value;
                  }
              }
          });
          return result;
      }

      

      try {
        const result = await RestEngine.run(rest, data)
        if (rest.output.databinding) {
          const oldVal = JSONPath.get(this.dataBindingValues, rest.output.databinding);

          const df_ = diff(oldVal, result)
          const fl_ = flatten(df_)
          const notEquals = Object.values(fl_).filter(e => e && Object.keys(e).length > 0).length > 0
          
          if (notEquals) {
            this.setDataBindingByKey(rest.output.databinding, result)
            // since 4.0.70 we also can the data binding...
            this.updateAllDataBindings(this.currentScreen.id, rest.output.databinding, oldVal, result)
            this.logger.log(-1, "executeRest","set data " + rest.output.databinding, this.dataBindingValues);
          }
          return true
        }
      } catch (e) {
        if (rest.output.databinding) {
          this.setDataBindingByKey(rest.output.databinding, "ERROR")
        }
        this.logger.error("executeRest","error", e);
        this.emit('onRestError', e, rest, data)
      }
      return false
    }
  }
}
</script>