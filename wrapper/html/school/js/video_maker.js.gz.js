(function(a) {
    a(".theme-cell").each(function() {
        var b = a(".apps > .btn:first-child", this);
        a(".theme-cover", this).click(function(c) {
            c.preventDefault();
            if (b.attr("href") !== undefined) window.location.href = b.attr("href")
            elseb.trigger("click")
        }).addClass("launch")
    });
    a(".themes .apps > .btn").tooltip()
})(jQuery);