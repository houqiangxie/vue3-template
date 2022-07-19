|-- undefined
    |-- .env
    |-- .env.build
    |-- .env.dev
    |-- .env.prod
    |-- .env.test
    |-- .eslintrc.js
    |-- .gitignore
    |-- index.html
    |-- package-lock.json
    |-- package.json
    |-- pnpm-lock.yaml
    |-- README.md
    |-- server.js
    |-- tsconfig.json
    |-- tsconfig.node.json
    |-- vite.config.ts
    |-- windi.config.ts
    |-- .vscode
    |   |-- extensions.json
    |-- nginx
    |   |-- http.conf
    |-- public
    |   |-- favicon.ico
    |   |-- video.html
    |   |-- css
    |   |   |-- loading.css
    |   |-- video
    |       |-- h5player.min.js
    |       |-- jsencrypt.min.js
    |       |-- jsWebControl-1.0.0.min.js
    |       |-- playctrl1
    |           |-- AudioRenderer.js
    |           |-- Decoder.js
    |           |-- DecodeWorker.js
    |           |-- SuperRender_10.js
    |-- src
        |-- auto-import.d.ts
        |-- components.d.ts
        |-- env.d.ts
        |-- assets
        |   |-- logo.png
        |   |-- images
        |   |   |-- glsh.png
        |   |   |-- logo.png
        |   |   |-- main.png
        |   |   |-- thumb.jpg
        |   |   |-- 蓝色地球免扣PN.png
        |   |   |-- icon
        |   |       |-- full-screen@2x.png
        |   |       |-- FZJZ@2x.png
        |   |       |-- GB@2x.png
        |   |       |-- quit-full-screen@2x.png
        |   |       |-- XZZF@2x.png
        |   |       |-- YJJY@2x.png
        |   |-- maps
        |   |   |-- heatmap.min.js
        |   |   |-- json
        |   |       |-- map.json
        |   |       |-- map2.json
        |   |       |-- mapStreet.json
        |   |       |-- road.geojson
        |   |       |-- test.json
        |   |       |-- thermodynamic.json
        |   |       |-- zhyj.json
        |   |       |-- 光明.json
        |   |       |-- 南山.json
        |   |       |-- 坪山.json
        |   |       |-- 大鹏新.json
        |   |       |-- 宝安.json
        |   |       |-- 深汕.json
        |   |       |-- 盐田.json
        |   |       |-- 福田.json
        |   |       |-- 罗湖.json
        |   |       |-- 龙华.json
        |   |       |-- 龙岗.json
        |   |-- nativeCustomTheme
        |   |   |-- customTheme.json
        |   |-- scss
        |       |-- common.scss
        |       |-- element-plus.scss
        |       |-- main.scss
        |       |-- variables.scss
        |-- common
        |   |-- utils
        |       |-- extend.ts
        |       |-- index.ts
        |       |-- observer.ts
        |       |-- relation.ts
        |       |-- mind
        |       |   |-- i-mind.d.ts
        |       |   |-- index.ts
        |       |   |-- mind.ts
        |       |-- tree
        |           |-- i-tree.d.ts
        |           |-- index.ts
        |           |-- tree.ts
        |-- components
        |   |-- business
        |   |   |-- person
        |   |       |-- DetailBaseInfo.vue
        |   |       |-- DetailEducationExp.vue
        |   |       |-- DetailFamilyMembers.vue
        |   |       |-- DetailGrowUp.vue
        |   |       |-- DetailTabs.vue
        |   |       |-- DetailTags.vue
        |   |       |-- DetailWorkInfo.vue
        |   |       |-- index.ts
        |   |-- common
        |   |   |-- CommonForm.vue
        |   |   |-- CustomTable.vue
        |   |   |-- PDF.vue
        |   |   |-- PDF2.vue
        |   |   |-- RegisterMessage.vue
        |   |   |-- SearchPanel.vue
        |   |-- ux
        |   |   |-- index.ts
        |   |   |-- common
        |   |   |   |-- styles
        |   |   |       |-- el-dark.scss
        |   |   |       |-- el.scss
        |   |   |-- file
        |   |   |   |-- index.ts
        |   |   |   |-- UxUpload.vue
        |   |   |-- form
        |   |   |   |-- i-form.d.ts
        |   |   |   |-- index.ts
        |   |   |   |-- UxForm.vue
        |   |   |   |-- UxFormCascader.vue
        |   |   |   |-- UxFormCheckbox.vue
        |   |   |   |-- UxFormColorPicker.vue
        |   |   |   |-- UxFormDatePicker.vue
        |   |   |   |-- UxFormErrorTip.vue
        |   |   |   |-- UxFormInput.vue
        |   |   |   |-- UxFormInputNumber.vue
        |   |   |   |-- UxFormRate.vue
        |   |   |   |-- UxFormSelect.vue
        |   |   |   |-- UxFormSlider.vue
        |   |   |   |-- UxFormSwitch.vue
        |   |   |-- mind
        |   |   |   |-- i-mind.d.ts
        |   |   |   |-- index.ts
        |   |   |   |-- UxMind.vue
        |   |   |   |-- UxMindTreeNode.vue
        |   |   |-- modal
        |   |   |   |-- index.ts
        |   |   |   |-- UxModal.vue
        |   |   |-- panel
        |   |   |   |-- index.ts
        |   |   |   |-- UxPanel.vue
        |   |   |-- record
        |   |   |   |-- index.ts
        |   |   |   |-- UxFilterRecords.vue
        |   |   |-- relation
        |   |   |   |-- index.ts
        |   |   |   |-- UxRelation.vue
        |   |   |-- table
        |   |   |   |-- i-table.d.ts
        |   |   |   |-- index.ts
        |   |   |   |-- UxTable.vue
        |   |   |   |-- UxTableColumn.vue
        |   |   |-- tabs
        |   |   |   |-- index.ts
        |   |   |   |-- UxTabs.vue
        |   |   |-- tag
        |   |   |   |-- index.ts
        |   |   |   |-- UxTag.vue
        |   |   |-- timeline
        |   |   |   |-- index.ts
        |   |   |   |-- UxTimeline.vue
        |   |   |-- tree
        |   |       |-- index.ts
        |   |       |-- UxTreeFilter.vue
        |   |-- web
        |-- hooks
        |   |-- charts
        |       |-- useWaterLevelHydrograph.ts
        |-- router
        |   |-- index.ts
        |   |-- permission.ts
        |-- store
        |   |-- common.ts
        |-- tsx
        |   |-- svg.tsx
        |   |-- tsxRenderComponent.tsx
        |-- utils
        |   |-- common.ts
        |   |-- emitter.ts
        |   |-- enumConfig.ts
        |   |-- haikang.ts
        |   |-- haikangH5.ts
        |   |-- md5.js
        |   |-- websocket.ts
        |   |-- cesiumExtend
        |   |   |-- cesiumMap.ts
        |   |   |-- cesiumMeasure.ts
        |   |   |-- cesiumTool.ts
        |   |   |-- plot
        |   |       |-- algorithm.js
        |   |       |-- drawFn.js
        |   |       |-- PlotIndex.vue
        |   |       |-- PlotUnits.vue
        |   |       |-- plotUtil.js
        |   |-- fetch
        |   |   |-- fetch.ts
        |   |   |-- interceptor.ts
        |   |-- map
        |   |   |-- map.ts
        |   |   |-- mapConfig.ts
        |   |   |-- mapEffectController.ts
        |   |   |-- mapMarker.ts
        |   |   |-- mapPopup.ts
        |   |   |-- mapSdk.ts
        |   |   |-- modelFactory.ts
        |   |-- providers
        |       |-- AmapMercatorTilingScheme.ts
        |       |-- BaiduImageryProvider.js
        |       |-- BaiduMercatorProjection.js
        |       |-- BaiduMercatorTilingScheme.js
        |       |-- CoordTransform.js
        |       |-- IndexedDBScheduler.ts
        |       |-- SuperMapImageryProvider.ts
        |-- views
            |-- Login.vue
            |-- web
                |-- App.vue
                |-- Index.vue
                |-- main.ts
                |-- home
                    |-- HomeIndex.vue
                    |-- PersonInfo.vue
