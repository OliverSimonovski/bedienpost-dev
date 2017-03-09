
i18next
  .use(window.i18nextXHRBackend)
  .init({
    /*debug: true,*/
    preload: ['en', 'nl'],
    fallbackLng: 'en',
    backend: {
      "loadPath": "lang/lang-{{lng}}.json"
    }
  });

function switchLanguage(lang){
    i18next.changeLanguage(lang);
}