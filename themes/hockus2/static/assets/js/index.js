/**
 * Main JS file for Casper behaviours
 */

/* globals jQuery, document */
(function ($, undefined) {
    "use strict";

    var $document = $(document);
    var permalink = function() {
      $('h1,h2,h3,h4,h5,h6').filter('[id]').each(function(i, el) {
        var $target  = $(el)
        var fragment = $target.attr('id')

        if ($target.find('a.permalink').length == 0 && fragment) {
          $target.append('<a href="#' + fragment + '" class="permalink"></a>')
        }
      })
    }

    $document.ready(function () {
      var $postContent = $(".post-content");
      $postContent.fitVids();

      $(".scroll-down").arctic_scroll();
      $(".menu-button[href='#'], .nav-cover, .nav-close").on("click", function(e){
          e.preventDefault();
          $("body").toggleClass("nav-opened nav-closed");
      });

      permalink();
    });

    // Arctic Scroll by Paul Adam Davis
    // https://github.com/PaulAdamDavis/Arctic-Scroll
    $.fn.arctic_scroll = function (options) {

        var defaults = {
            elem: $(this),
            speed: 500
        },

        allOptions = $.extend(defaults, options);

        allOptions.elem.click(function (event) {
            event.preventDefault();
            var $this = $(this),
                $htmlBody = $('html, body'),
                offset = ($this.attr('data-offset')) ? $this.attr('data-offset') : false,
                position = ($this.attr('data-position')) ? $this.attr('data-position') : false,
                toMove;

            if (offset) {
                toMove = parseInt(offset);
                $htmlBody.stop(true, false).animate({scrollTop: ($(this.hash).offset().top + toMove) }, allOptions.speed);
            } else if (position) {
                toMove = parseInt(position);
                $htmlBody.stop(true, false).animate({scrollTop: toMove }, allOptions.speed);
            } else {
                $htmlBody.stop(true, false).animate({scrollTop: ($(this.hash).offset().top) }, allOptions.speed);
            }
        });

    };
})(jQuery);
