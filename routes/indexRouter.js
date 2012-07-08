function IndexRouter (config) {

}

IndexRouter.prototype.home = function (req, res) {
  res.render('index', { title: 'Colext' });
};

exports.create = function (config) {
  return new IndexRouter(config);
};
