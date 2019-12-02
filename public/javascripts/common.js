const common = (() => {
  
  return {
    documentReady:(callback) => {
      if (document.readyState != 'loading'){
        callback();
      } else {
        document.addEventListener('DOMContentLoaded', callback);
      }
    },
    searchSummoner:(event) => {

    }
  }

})();