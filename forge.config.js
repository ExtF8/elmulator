module.exports = {
    packagerConfig: {
        asar: true,
        icon: __dirname + '/images/icons/icon',
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                options: {
                    setupIcon: __dirname + '/images/icons/icon.ico',
                },
            },
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
    ],
};
