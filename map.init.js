jQuery(function($) {
    var inDetails = false;
    var container = $("#map");

    var r = Raphael('map', container.width(), container.height());
    var panZoom = r.panzoom({
        initialZoom: 6,
        initialPosition: {
            x: 120,
            y: 70
        }
    });
    var isHandling = false;

    panZoom.enable();
    r.safari();

    var attributes = {
        fill: '#F1F1F1',
        stroke: '#FFFFFF',
        'stroke-width': 2,
        'stroke-linejoin': 'round'
    };

    var overlay = r.rect(0, 0, r.width, r.height);
    overlay.attr({
        fill: '#ffffff',
        'fill-opacity': 0,
        "stroke-width": 0,
        stroke: '#ffffff'
    });

    var countries = [];
    var i = 0;
    for (var country in paths) {
        var obj = r.path(paths[country].path);
        obj.attr(attributes);
        obj.click(handleDetails);
        obj.data("hoverFill", "#3e5f43");
        obj.data("fill", "#F1F1F1");
		obj.data("id", i);
        obj.data("name", paths[country].name)
        obj.hover(animateOver, animateOut);
		

        var element = document.createElement("input");
        //Assign different attributes to the element. 
        element.type = "button";
        element.value = paths[country].name;
        element.name = paths[country].name;
        element.className = "myButton";
        element.setAttribute('data-id', i)

        infolist.appendChild(element);


        countries[i] = {};
        countries[i].name = paths[country].name;
        //countries[i].centerpos = pathtocenter(paths[country].path);
        countries[i].objectp = obj;
        i++;
    }

	
	var lastobject = null;
    var doButtonPress = function() {
        var country = countries[$(this).data("id")];
        //alert(country.name);
        //moveto(country.centerpos.x, country.centerpos.y)
  
  
		if (lastobject != null) {
			lastobject.objectp.attr("fill", lastobject.objectp.data("fill"));	
		}
        if (country.objectp.data("hoverFill")) {
            country.objectp.attr("fill", country.objectp.data("hoverFill"));
        }
		lastobject = country;
		displayDetails(country);
    }

    $(".myButton").click(doButtonPress);

    function pathtocenter(path) {
        //needs improvement
        var out = {};
        var a = path.replace(/[a-zA-Z ]+/g, "|");
        var b = a.split("|");
        var c = b[1].split(",");
        out.x = c[0];
        out.y = c[1].
        split(" ")[0];
        //alert(out.x + "," + out.y);	
        return out
    }

    function moveto(x, y) {
        //alert(x +","+ y)
        var currentpos = panZoom.getCurrentPosition();
        panZoom.pan(x - currentpos.x, y - currentpos.y);
        var currPaperZoom = panZoom.getCurrentZoom();
        //alert(currPaperZoom);	
        //panZoom.zoomIn(10 - currPaperZoom);
        //panZoom.enable();
    }

    $("#mapContainer #up").click(function(e) {
        panZoom.zoomIn(1);
        e.preventDefault();
    });

    $("#mapContainer #down").click(function(e) {
        panZoom.zoomOut(1);
        e.preventDefault();
    });

    function animateOver() {
        if (this.data("hoverFill")) {
            this.attr("fill", this.data("hoverFill"));
        }
    }

    function animateOut() {
        if (this.data("fill")) {
            this.attr("fill", this.data("fill"));
        }
    }
	
	function displayDetails(obj) {
		document.getElementById("infoname").innerHTML = obj.name	
	}

    function handleDetails() {
        document.getElementById("infoname").innerHTML = this.data("name")

        // need to re enable panzoom for some reason
        panZoom.enable();

    }

});