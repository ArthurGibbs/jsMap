jQuery(function($) {
    var container = $("#map");
    var r = new Raphael('map', 5000, 5000);
    var panZoom = r.panzoom({
        initialZoom: 2,
        minZoom: 1,
        initialPosition: {
            x: 94,
            y: 213
        }
    });
    panZoom.enable();
    r.safari();
    var mapObjects = [];
    var rotationTimer;
    var lastSelectedObject = null;
    var fuseSearchBook = {};
    var pluseCount = 0;
    var pulseOpacity = 0.5;
    //Disabled due to causing crash? unsolved
    rotationTimer = setTimeout(rotate, 20);
	
    var form = document.getElementById('searchbox');
    form.addEventListener('keyup', search, false);
	
    $.get("data/map.svg", function(d) {
        var i = 0;
        $(d).find('path').each(function() {
            // Extract from SVG
            var $book = $(this);
            var objectRawTitle = $book.find('title').text();
            var singularInstance = {};
            singularInstance.id = i;
            singularInstance.options = getOptionsFromString(objectRawTitle);
            singularInstance.hide = getIsHidden(singularInstance.options)


            singularInstance.title = getTitleFromString(objectRawTitle);
            singularInstance.description = $book.find('desc').text();
            singularInstance.path = $book.attr("d");
            singularInstance.objectName = $book.attr("id");
            singularInstance.style = $book.attr("style");
            singularInstance.objectp = placeObject(singularInstance);

            mapObjects[i] = singularInstance;
            i = i + 1;
        });
        showDefaultButtons();
        $(".myButton").click(handleButtonClick);
        var searchOptions = {
            keys: ['title', 'description'], // keys to search in
            id: 'id' // return a list of identifiers only
        };
        fuseSearchBook = new Fuse(mapObjects, searchOptions);
    });

	function handleObjectClick() {
        var mapObject = mapObjects[this.data("id")];
        displayDetails(mapObject);
        OpenOwnRoof(mapObject);
        OpenCoveringRoofs(mapObject);
        panZoom.enable();
    }
	
    function handleButtonClick() {
        var mapObject = mapObjects[$(this).data("id")];
        if (roofNumber(mapObject.options) != null) {

            mapObject.objectp.toFront();
            mapObject.objectp.data("fill", mapObject.objectp.data("original-fill"));
            mapObject.objectp.attr("fill", mapObject.objectp.data("fill"));
        }
        clearlastHighlight();
        lastSelectedObject = mapObject;
        displayDetails(mapObject);
        mapObject.objectp.attr({
            fill: mapObject.objectp.data("hoverFill"),
            opacity: pulseOpacity
        });
        OpenCoveringRoofs(mapObject);
    }

    function placeObject(instance) {
        var attributes = {
            fill: '#F1F1F1',
            stroke: '#000000',
            'stroke-width': 0.0,
            'stroke-linejoin': 'round',
            opacity: 1
        };
        var obj = r.path(instance.path);
        var rx = /.*fill\:(#[a-z0-9]+);/gm;
        var arr = rx.exec(instance.style);
        if (arr !== null && arr[1] !== null) {
            attributes.fill = arr[1];
            obj.data("fill", arr[1]);
            obj.data("original-fill", arr[1]);
        }

        rx = /.*fill-opacity\:([0-9]+);/gm;
        arr = rx.exec(instance.style);
        if (arr !== null && arr[1] !== null) {
            obj.data("opacity", arr[1]);
            attributes.opacity = arr[1];
        }

        obj.attr(attributes);
        obj.click(handleObjectClick);
        obj.data("hoverFill", "#FA1167");
        var ops = instance.options;

        if (!instance.hide) {
            obj.
            hover(animateOver, animateOut);
        }
        obj.data("id", instance.id);
        return obj
    }	

    function getIsHidden(options) {
        var h = false;
        if (options !== null) {
            h = (options.indexOf("h") >= 0);
        }
        return h;
    }

    function getTitleFromString(string) {
        var title = null;
        var rx = /^([^\[]*)/gm;
        var arr = rx.exec(string);
        title = null;
        if (arr !== null && arr[1]) {
            title = arr[1];
        }
        return title;
    }

    function getOptionsFromString(string) {
        rx = /\[(.*)\]/gm;
        arr = rx.exec(string);
		result = null;
        if (arr !== null && arr[1]) {
            result = arr[1];
        }
		return result;
    }

    function rotate() {
        if (mapObjects.length > 0) {
            for (var i = 0; i <= mapObjects.length; i++) {
                if (mapObjects[i] && mapObjects[i].options) {
                    if (mapObjects[i].options.indexOf("R") >= 0) {
                        mapObjects[i].objectp.rotate(8);
                    }
                }
            }
        }
        clearTimeout(rotationTimer)
        rotationTimer.remove;
        rotationTimer = setTimeout(rotate, 20);

        pluseCount = (pluseCount + 10) % 360;

        if (lastSelectedObject != null) {
            var mopactity = 0.4 + 0.6 * ((Math.cos(toRadians(pluseCount)) + 1) / 2);
            pulseOpacity = mopactity;
            lastSelectedObject.objectp.attr({
                fill: lastSelectedObject.objectp.data("hoverFill"),
                opacity: pulseOpacity
            });
        }
    }

    function toRadians(angle) {
        return angle * (Math.PI / 180);
    }

    function placeButton(instance) {
        var element = document.createElement("input");
        //Assign different attributes to the element. 
        element.type = "button";
        element.value = instance.title;
        element.name = instance.title;
        element.className = "myButton";
        element.setAttribute('data-id', instance.id);
        infolist.appendChild(element);

    }

    function search() {
        var seachText = document.getElementById('searchbox').value
        infolist.innerHTML = "";
        if (seachText.length > 0) {
            var results = fuseSearchBook.search(seachText);
            if (results.length > 0) {
                for (var i = 0; i < results.length; ++i) {
                    placeButton(mapObjects[results[i]]);
                }
            } else {
                infolist.innerHTML = "Your search - " +
                    seachText +
                    " - did not match any records.";
            }
        } else {
            showDefaultButtons();
        }
        $(".myButton").click(handleButtonClick);
    }

    function showDefaultButtons() {
        for (var j = 0; j < mapObjects.length; ++j) {
            if (mapObjects[j].title &&
                !(mapObjects[j].options &&
                    mapObjects[j].options.indexOf("o") >= 0)) {
                placeButton(mapObjects[j]);
            }
        }
    }

    function clearlastHighlight() {
        if (lastSelectedObject !== null) {
            lastSelectedObject.objectp.attr({fill: lastSelectedObject.objectp.data("fill"), opacity: 1});
        }

        displayDetails(null);
        lastSelectedObject = null;
    }

    $("#mapContainer #up").click(function(e) {
        panZoom.zoomIn(1);
        e.preventDefault();
    });

    $("#mapContainer #down").click(function(e) {
        panZoom.zoomOut(1);
        e.preventDefault();
    });

    $("#others #moveTopLeft").click(function(e) {
        panZoom.pan(1, 1);
    });

    function animateOver() {
        clearlastHighlight();
        var mapObject = mapObjects[this.data("id")];


        if (!mapObject.hide) {
            lastSelectedObject = mapObject;
        }

        if (mapObject.title) {
            displayDetails(mapObject);
            if (this.data("hoverFill")) {
                this.attr("fill", this.data("hoverFill"));
            }
        }
    }

    function animateOut() {
        clearlastHighlight();
    }

    function displayDetails(obj) {
        if (obj !== null) {
            document.getElementById("infoname").innerHTML = obj.title;
            document.getElementById("infodetail").innerHTML = obj.description;
        } else {
            document.getElementById("infoname").innerHTML = "";
            document.getElementById("infodetail").innerHTML = "";
        }
    }

    function OpenCoveringRoofs(mapObject) {
        var options = mapObject.options;
        var roofRegex = /B\=([0-9]+)/g;
        var matches;
        while (matches = roofRegex.exec(options)) {
            OpenRoof(matches[1]);
        }
    }

    function roofNumber(options) {
        return matchOrNull(options, ".*[b]\=([0-9]+)(?:$|[a-zA-z])", "gm");
    }

    function OpenOwnRoof(mapObject) {
        var roofid = roofNumber(mapObject.options);
        if (roofid) {
            OpenRoof(roofid);
        }
    }

    function OpenRoof(id) {
        if (mapObjects.length > 0) {
            for (var i = 0; i <= mapObjects.length; i++) {
                if (mapObjects[i] && mapObjects[i].options) {
                    var match = matchOrNull(mapObjects[i].options, "(b=" + id + ")(?:$|[a-zA-Z])", "");
                    if (match != null) {
                        mapObjects[i].objectp.toBack();
                        mapObjects[i].objectp.data("fill", "#777777");
                        mapObjects[i].objectp.attr("fill", mapObjects[i].objectp.data("fill"));
                    }
                }
            }
        }
    }

    function matchOrNull(input, patternString, optionString) {
        var regex = new RegExp(patternString, optionString);
        var result = null;
        var arr = regex.exec(input);
        if (arr !== null && arr[1] !== null) {
            result = arr[1];
        }
        return result;
    }

});