window.showLoader = function (show) {
  var loader = document.getElementById('loader');
  if (loader) loader.style.display = show ? 'block' : 'none';
};
