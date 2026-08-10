import {
    defineConfig,
    presetWind4,
    presetAttributify,
    presetIcons,
    transformerDirectives,
    transformerVariantGroup,
} from 'unocss'

export default defineConfig({
    presets: [
        presetWind4(),

        presetAttributify(),

        presetIcons({
            autoInstall: true,
            scale: 1.2,
            warn: true,
        }),
    ],

    shortcuts: {
        center: 'flex items-center justify-center',
        'flex-col': 'flex flex-col',
        'flex-col-center': 'flex-col items-center justify-center',
        btn: [
            'px-4 py-2 rounded-md',
            'bg-blue-600 text-white',
            'hover:bg-blue-700',
            'disabled:bg-gray-400 disabled:cursor-not-allowed',
            'transition-colors',
        ].join(' '),

        'icon-btn': [
            'inline-flex items-center justify-center',
            'cursor-pointer select-none',
            'opacity-75',
            'transition',
            'hover:opacity-100 hover:text-blue-600',
            'outline-none',
        ].join(' '),
    },

    transformers: [
        transformerDirectives(),
        transformerVariantGroup(),
    ],
})