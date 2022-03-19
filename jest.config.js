// eslint-disable-next-line no-undef
module.exports = {
  moduleDirectories: ['node_modules', 'src', 'generated'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};
