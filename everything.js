function loadAnts() {
    if (window.antsLoading === undefined) {
        if (window.antss === undefined) {
            window.antsLoading = 0;
        } else {
            window.antsLoading = 4;
        }
    }
    var someFiles = ['//code.jquery.com/jquery-3.6.1.js',
                     '//www.cs.huji.ac.il/~irush/scripts/jquery.highlight-3.js',
                     '//www.cs.huji.ac.il/~irush/scripts/ants.js'];
    protocol = "https:";
    if (window.location.protocol !== undefined)
        protocol = window.location.protocol
    switch (window.antsLoading) {
      case 0:
      case 1:
      case 2:
          if (window.antss !== undefined)
              break;
          document.getElementsByTagName('head')[0].appendChild(document.createElement('script')).setAttribute('src',protocol + someFiles[antsLoading]);
          break;
      case 3:
          $("body").highlight("a");
          $("body").highlight("e");
          $("body").highlight("i");
          $("body").highlight("o");
          $("body").highlight("u");
          $("body").highlight("׳");
          $("body").highlight("׳”");
          $("body").highlight("׳•");
          $("body").highlight("׳™");
          new Ants({forage: true});
          break;
      default:
          if (antss.length > 0)
              new Ant(antss[0]);
          return;
    }
    window.antsLoading++;
    setTimeout("loadAnts()", 100);
    return;
}

(function () {
    setTimeout("loadAnts()", 100);
 })();
