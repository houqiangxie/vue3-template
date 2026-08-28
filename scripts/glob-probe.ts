const modules = import.meta.glob('/src/views/web/**/*.vue')
const keys = Object.keys(modules)
const result = {
  total: keys.length,
  hasRootIndex: '/src/views/web/index.vue' in modules,
  indexKeys: keys.filter(k => k.endsWith('/index.vue') || k.endsWith('\\index.vue')),
  rootVue: keys.filter(k => (k.match(/\//g) || []).length === 4),
}
console.log(JSON.stringify(result, null, 2))
