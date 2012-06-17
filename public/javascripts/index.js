window.App = Ember.Application.create();

$(document).ready(function() {
    $('#current').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('#history').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
});
