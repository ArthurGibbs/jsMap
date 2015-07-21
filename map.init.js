jQuery(function($) {
    var container = $("#map");
    var r = Raphael('map', 5000, 5000);
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

	//Disabled due to causing crash? unsolved
	//rotationTimer = setTimeout(rotate, 20);

	
    $.get("data/map.svg", function(d) {
        var i = 0;
        $(d).find('path').each(function() {
			// Extract from SVG
            var $book = $(this);
            var objectRawTitle = $book.find('title').text();				
            var singularInstance = {};
            singularInstance.id = i;
            singularInstance.options = getOptionsFromString(objectRawTitle);
			singularInstance.title = getTitleFromString(objectRawTitle);
            singularInstance.description = $book.find('desc').text();;
            singularInstance.path = $book.attr("d");
            singularInstance.objectName = $book.attr("id");			
            singularInstance.style = $book.attr("style");
            singularInstance.objectp = placeObject(singularInstance);
			singularInstance.pos = getPos(singularInstance);       
			
            mapObjects[i] = singularInstance;		
            i++;
        });
		
		showDefaultButtons();
		var searchOptions = {
			keys: ['title','description'],  // keys to search in
			id: 'id'                        // return a list of identifiers only
		}				
		fuseSearchBook = new Fuse(mapObjects, searchOptions);
    });
	
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
		if (arr !== null && arr[1]) {
			return arr[1];
		}
		else {
			return null
		}	
	}
	
	function getPos(obj) {
		pos = {};
        pos.x = obj.objectp.getBBox().x + (obj.objectp.getBBox().width / 2);
        pos.y = obj.objectp.getBBox().y + (obj.objectp.getBBox().height / 2);
		return pos;
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
		$(".myButton").click(handleButtonClick);
    }
	
	var form=document.getElementById('searchbox');
	form.addEventListener('keyup',search,false);
	
	function search(){
		var seachText = document.getElementById('searchbox').value
		infolist.innerHTML = "";	
		if (seachText.length > 0) {
			var results = fuseSearchBook.search(seachText);
			if (results.length > 0 ) {		
				for (var i = 0; i < results.length; ++i) {		
					placeButton(mapObjects[results[i]]);
				}
			} 
			else {
				infolist.innerHTML = "Your search - " + 
				seachText + 
				" - did not match any records.";		
			}
		}
		else {
			showDefaultButtons();
		}
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

    function placeObject(instance) {
        var attributes = {
            fill: '#F1F1F1',
            stroke: '#000000',
            'stroke-width': 1,
            'stroke-linejoin': 'round'
        };
        var obj = r.path(instance.path);

        var rx = /.*fill\:(#[a-z0-9]+);/gm;
        var arr = rx.exec(instance.style);
        if (arr !== null && arr[1] !== null) {
            attributes.fill = arr[1];
            obj.data("fill", arr[1]);
            obj.data("original-fill", arr[1]);
        } 

        obj.attr(attributes);
        obj.click(handleObjectClick);
        obj.data("hoverFill", "#FA1167");

        var ops = instance.options;
        if (!ops || !ops.indexOf("h") >= 0) {
            obj.hover(animateOver, animateOut);
        }
        obj.data("id", instance.id);
        return obj
    }

	function handleButtonClick() {
        var mapObject = mapObjects[$(this).data("id")];
        mapObject.objectp.toFront();
        mapObject.objectp.data("fill", mapObject.objectp.data("original-fill"));
        clearlastHighlight();
        mapObject.objectp.attr({
            "fill-opacity": 1
        });
        if (mapObject.objectp.data("hoverFill")) {
            mapObject.objectp.attr("fill", mapObject.objectp.data("hoverFill"));
        }
        lastSelectedObject = mapObject;
        displayDetails(mapObject);
		//TODO zoom to does not work yet
        //zoomTo(mapObject);
        possibleOpenParentRoof(mapObject);
    }
	
	function handleObjectClick() {
        var mapObject = mapObjects[this.data("id")];
        displayDetails(mapObject);
        possibleOpenRoof(mapObject);
        possibleOpenParentRoof(mapObject);
        panZoom.enable();
    }

    function zoomTo(mapObject) {
		var currentPos = panZoom.getCurrentPosition();
		// alert("current:" + currentPos.x + "," + currentPos.y);
		//alert("object:" + mapObject.pos.x + "," + mapObject.pos.y);
		//alert(panZoom.getCurrentZoom());
		//panZoom.zoomIn(7 - panZoom.getCurrentZoom());
		var difx = mapObject.pos.x - currentPos.x;
		var dify = mapObject.pos.y - currentPos.y;
		//alert("diff:" + difx + "," + dify);
		//panZoom.pan(difx * 0.3, dify * 0.3);
		//panZoom.pan(10, 10);
		// pointTo(p2, difx +500, dify+500);
    }

    function clearlastHighlight() {
        if (lastSelectedObject !== null) {
            lastSelectedObject.objectp.attr("fill", lastSelectedObject.objectp.data("fill"));
        }
    }

    $("#mapContainer #up").click(function(e) {
        panZoom.zoomIn(1);
        e.preventDefault();
    });
	
    $("#mapContainer #down").click(function(e) {
        panZoom.zoomOut(1);
        e.preventDefault();
    });
	
	$("#others #moveTopLeft").click(function (e) {
        panZoom.pan(1,1);
    });

    function animateOver() {
        clearlastHighlight();
        var mapObject = mapObjects[this.data("id")];
        if (mapObject.title) {
            displayDetails(mapObject);
            if (this.data("hoverFill")) {
                this.attr("fill", this.data("hoverFill"));
            }
        }
    }

    function animateOut() {
        displayDetails(null);
        if (this.data("fill")) {
            this.attr("fill", this.data("fill"));
        }
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



    function possibleOpenParentRoof(mapObject) {
		var options = mapObject.options;
		var qualityRegex = /B\=([0-9]+)/g,
		matches,
		qualities = [];

		while (matches = qualityRegex.exec(options)) {
			openRoof(matches[1]); 
		}
    }

    function possibleOpenRoof(mapObject) {
        var rx = /.*[b]\=([0-9])+.*/gm;
        var arr = rx.exec(mapObject.options);
        if (arr !== null && arr[1] !== null) {
            openRoof(arr[1]);
        }
    }

    function openRoof(id) {
		//alert("opening roof :" + id);
        if (mapObjects.length > 0) {
            for (var i = 0; i <= mapObjects.length; i++) {
                if (mapObjects[i] && mapObjects[i].options) {
                    if (mapObjects[i].options.indexOf("b=" + id) >= 0) {
                        mapObjects[i].objectp.toBack();
                        mapObjects[i].objectp.attr("fill", "#777777");
                        mapObjects[i].objectp.data("fill", "#777777");	
                    }
                }
            }
        }
    }
	
	function pointTo(p, x, y) {
        var path = "m " + x + "," + y + " 5,30 5,-10 10,0 -20,-20 z";
        if (p !== null) {
            p.remove();
        }
        p = r.path(path);
        var attributes = {
            fill: 'FF0080',
            stroke: '#000000',
            'stroke-width': 1,
            'stroke-linejoin': 'round'
        };
        p.data("fill", "#F1F1F1");
        p.attr(attributes);
    }
});