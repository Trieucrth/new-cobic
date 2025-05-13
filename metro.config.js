const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Thêm cấu hình cho resolver
config.resolver = {
  ...config.resolver,
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'svg'],
  assetExts: ['png', 'jpg', 'jpeg', 'gif', 'webp']
};

module.exports = config; 