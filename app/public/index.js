
var InitializeGraph = function () {

    $.ajax({
        url: "/settings",
        type: "GET",
        cache: false,
        dataType: 'json',
        success: function (settings) {
            var dialog = $("#newrundialog");
            dialog.data('settings', settings);
            setButtonState(settings.running);
        },
        error: function (xhr, status, err) {
            alert('failed to get settings: ' + status + ' - ' + err);
        }
    });

    $.ajax({
        url: "/runs",
        type: "GET",
        cache: false,
        dataType: 'json',
        success: function (data) {

            var select = $("#runs");
            select.empty();  // clear existing runs

            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    select.append("<option value='" + data[i].id + "'>" + data[i].Description + ' - ' + data[i].Timestamp + "</option>");
                }

                RefreshGraph(data[0].id);
            } else {
                $('#buttonContinue').hide();
                $('#buttonDelete').hide();
            }
        },
        error: function (xhr, status, err) {
            alert('failed to get runs: ' + status + ' - ' + err);
        }
    });

   
}

var StopRun = function () {
    $.ajax({
        url: "/stopRun",
        type: "POST",
        success: function (response) {
            InitializeGraph();
            setButtonState(false);
            _this.dialog("close");
        },
        error: function (xhr, status, err) {
            alert(status + ' - ' + err);
            _this.dialog("close");
        }
    });

}

var Delete = function (runId) {
    $.ajax({
        url: "/deleteRun?runId=" + runId,
        type: "POST",
        success: function (response) {
            InitializeGraph();
            _this.dialog("close");
        },
        error: function (xhr, status, err) {
            alert(status + ' - ' + err);
            _this.dialog("close");
        }
    });

}

var Configure = function (startNew, runId) {

    $.ajax({
        url: "/settings",
        type: "GET",
        cache: false,
        dataType: 'json',
        success: function (settings) {

            var dialog = $("#newrundialog");
            dialog.find("#description").val(settings.description);
            dialog.find("#weight").val(settings.weight);

            $("input[name=r1][value=" + settings.food + "]").prop('checked', true);

            dialog.find("#p1name").val(settings.p1.name);
            dialog.find("#p1high").val(settings.p1.high);
            dialog.find("#p1low").val(settings.p1.low);

            dialog.find("#p2name").val(settings.p2.name);
            dialog.find("#p2high").val(settings.p2.high);
            dialog.find("#p2low").val(settings.p2.low);

            dialog.find("#p3name").val(settings.p3.name);
            dialog.find("#p3high").val(settings.p3.high);
            dialog.find("#p3low").val(settings.p3.low);

            dialog.find("#p4name").val(settings.p4.name);
            dialog.find("#p4high").val(settings.p4.high);
            dialog.find("#p4low").val(settings.p4.low);

            dialog.data('settings', settings);
            dialog.data("startnew", startNew);
            dialog.data("runid", runId);
            dialog.dialog('open');
        },
        error: function (xhr, status, err) {
            alert('failed to get settings: ' + status + ' - ' + err);
        }
    });
}

var setButtonState = function (running) {
    if (running) {
        $('#buttonNew').hide();
        $('#buttonContinue').hide();
        $('#buttonDelete').hide();
        $('#buttonStop').show();
        $('#buttonConfigure').show();
    } else {
        $('#buttonNew').show();
        $('#buttonContinue').show();
        $('#buttonDelete').show();
        $('#buttonStop').hide();
        $('#buttonConfigure').hide();
    }
}

var probeConnected = function(tempData) {
    if (tempData== null || tempData.length == 0)
        return false;

    for (var i = 0; i < tempData.length; i++) {
        //  console.log('tempData: ' + tempData[i][0] + ' ' + tempData[i][1]);
        if (tempData[i][1] != null)
            return true;
    }

    return false;
}

var RefreshGraph = function (runId) {

    var options = {
        series: {
            lines: { show: true },
            //points: { show: true },
            shadowSize: 0
        },
        xaxis: { mode: 'time', timezone: 'browser', timeformat: '%I:%M' },
        yaxes: [{ tickFormatter: function (val, axis) { return val.toFixed(1) + " \u00B0F"  } }],
        selection: { mode: "x" },
        crosshair: { mode: "x" },
        legend: {position: "nw"},
        grid: { hoverable: true, autoHighlight: false }
        //zoom: { interactive: true }
    };

    var T1 = [], T2 = [], T3 = [], T4 = [];
    $.ajax({
        url: '/readRunData?runId=' + runId,
        type: "GET",
        cache: false,
        dataType: 'json',
        success: function (data) {

            /*if (data.length == 0) {
                console.log('no data returned');
                return;
            }*/

            var dialog = $("#newrundialog");
            var settings = dialog.data('settings');

            for (var i = 0; i < data.length; i++) {
                var ts = (new Date(data[i].Timestamp)).getTime();
                T1.push([ts, data[i].T1]);
                T2.push([ts, data[i].T2]);
                T3.push([ts, data[i].T3]);
                T4.push([ts, data[i].T4]);
            }

            var data = [];

            if (probeConnected(T1))
                data.push({ data: T1, label: settings.p1.name + " = 000.0", points: { show: true, radius: 1 } });
            if (probeConnected(T2))
                data.push({ data: T2, label: settings.p2.name + " = 000.0", points: { show: true, radius: 1 } });
            if (probeConnected(T3))
                data.push({ data: T3, label: settings.p3.name + " = 000.0", points: { show: true, radius: 1 } });
            if (probeConnected(T4))
                data.push({ data: T4, label: settings.p4.name + " = 000.0", points: { show: true, radius: 1 } });

            var placeholder = $("#placeholder");

            placeholder.bind("plothover", function (event, pos, item) {
                latestPosition = pos;
                if (!updateLegendTimeout) {
                    updateLegendTimeout = setTimeout(updateLegend, 50);
                }
            });

            placeholder.dblclick(function () {
                options.xaxis.min = null;
                options.xaxis.max = null;
                plot = $.plot(placeholder, data, options);
            });

            placeholder.bind("plotselected", function (event, ranges) {

                $("#selection").text(ranges.xaxis.from.toFixed(1) + " to " + ranges.xaxis.to.toFixed(1));

                plot = $.plot(placeholder, data, $.extend(true, {}, options, {
                    xaxis: {
                        min: ranges.xaxis.from,
                        max: ranges.xaxis.to
                    }
                }));

            });

            placeholder.bind("plotunselected", function (event) {
                $("#selection").text("");
            });

            var plot = $.plot(placeholder, data, options);


            var legends = $("#placeholder .legendLabel");

            legends.each(function () {
                // fix the widths so they don't jump around
                $(this).css('width', $(this).width());
            });

            var updateLegendTimeout = null;
            var latestPosition = null;

            function updateLegend() {

                updateLegendTimeout = null;

                var pos = latestPosition;

                var axes = plot.getAxes();
                if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
                    pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
                    return;
                }

                var i, j, dataset = plot.getData();
                for (i = 0; i < dataset.length; ++i) {

                    var series = dataset[i];

                    // Find the nearest points, x-wise

                    for (j = 0; j < series.data.length; ++j) {
                        if (series.data[j][0] > pos.x) {
                            break;
                        }
                    }

                    // Now Interpolate

                    var y,
                        p1 = series.data[j - 1],
                        p2 = series.data[j];

                    if (p1 == null) {
                        y = p2[1];
                    } else if (p2 == null) {
                        y = p1[1];
                    } else {
                        y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
                    }

                    legends.eq(i).text(series.label.replace(/=.*/, "= " + y.toFixed(1)));
                }
            }
        },
        error: function (xhr, status, err) {
            alert('Failed to read data for runId=' + runId + '  ' + status + ' - ' + err);
        }
    });
}


var GetNumber = function (val) {
    if (isNaN(parseFloat(val))) {

        return null;

    }
    
    return Number(val);
}

function getSettings(dialog) {
    var settings = dialog.data('settings');

    settings.description = dialog.find("#description").val();
    settings.weight = Number(dialog.find("#weight").val());
    settings.food = $('input[name=r1]:checked').val();

    settings.p1.name = dialog.find("#p1name").val();
    settings.p1.high = GetNumber(dialog.find("#p1high").val());
    settings.p1.low = GetNumber(dialog.find("#p1low").val());

    settings.p2.name = dialog.find("#p2name").val();
    settings.p2.high = GetNumber(dialog.find("#p2high").val());
    settings.p2.low = GetNumber(dialog.find("#p2low").val());

    settings.p3.name = dialog.find("#p3name").val();
    settings.p3.high = GetNumber(dialog.find("#p3high").val());
    settings.p3.low = GetNumber(dialog.find("#p3low").val());

    settings.p4.name = dialog.find("#p4name").val();
    settings.p4.high = GetNumber(dialog.find("#p4high").val());
    settings.p4.low = GetNumber(dialog.find("#p4low").val());

    return settings;
}

window.onload = function () {

    $("#newrundialog").dialog({
        autoOpen: false,
        width: 550,
        modal: true,
        buttons: {
            Cancel: function () {
                $(this).dialog("close");
            },
            OK: function () {
                console.log('dialog new run');
                var settings = getSettings($(this));
                _this = $(this);
                var startNew = $(this).data('startnew');
                var runId = $(this).data('runid');

                if (startNew) {
                    $.ajax({
                        url: "/startRun?runId=" + runId,
                        type: "POST",
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify({ settings: settings }),
                        success: function (response) {
                            InitializeGraph();
                            setButtonState(true);
                            _this.dialog("close");
                        },
                        error: function (xhr, status, err) {
                            alert(status + ' - ' + err);
                            _this.dialog("close");
                        }
                    });
                } else {
                    $.ajax({
                        url: "/settings",
                        type: "POST",
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify({ settings: settings }),
                        success: function (response) {
                            _this.dialog("close");
                        },
                        error: function (xhr, status, err) {
                            alert(status + ' - ' + err);
                            _this.dialog("close");
                        }
                    });
                }
            }
        },
        close: function () {
            //alert('close')
        }
    });
}
