var availableLangs = ['en', 'nl'];

console.time('loaded');
i18next
  .use(window.i18nextXHRBackend)
  .init({
      /*debug: true,*/
      preload: availableLangs,
      fallbackLng: availableLangs.indexOf(navigator.language) >= 0 ? navigator.language : 'en',
      keySeparator: false,
      nsSeparator: false,
      backend: {
        "loadPath": "lang/lang-{{lng}}.json"
      }
  })
  .on('loaded', function(loaded) {
    console.timeEnd('loaded');

    listingViewModel.language(navigator.language || null);
  });

/*i18next.on('missingKey', function(lngs, namespace, key, res) {
  console.info("missingKey:" + key);
});*/

function switchLanguage(lang) {
  i18next.changeLanguage(lang);
}