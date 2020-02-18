module.exports = {
    pluginOptions: {
        quasar: {
            treeShake: true
        },
        electronBuilder: {
            appId: 'fair4health-data-privacy-tool',
            customFileProtocol: 'fair4health://./',
            mainProcessFile: 'src/electron-main.ts',
            builderOptions: {
                productName: 'FAIR4Health Data Privacy Tool',
                mac: {
                    icon: './dist_electron/bundled/icons/icon.icns'
                },
                win: {
                    icon: './dist_electron/bundled/icons/icon.ico'
                },
                linux: {
                    icon: './dist_electron/bundled/icons',
                    target: ['AppImage', 'deb'],
                    category: 'Office'
                },
                nsis: {
                    oneClick: false,
                    perMachine: true,
                    allowToChangeInstallationDirectory: true,
                    createDesktopShortcut: true
                }
            }
        }
    },
    transpileDependencies: [
        /[\\\/]node_modules[\\\/]quasar[\\\/]/
    ]
};
