jQuery(function($) {
    var inDetails = false;
    var container = $("#map");
    var r = Raphael('map', 5000, 5000);
    var panZoom = r.panzoom({
        initialZoom: 2,
		//maxZoom: 12,
        initialPosition: {
            x: 271,
            y: 285
        }
    });
    var isHandling = false;
    panZoom.enable();
    r.safari();
    var overlay = r.rect(0, 0, r.width, r.height);
    overlay.attr({
        fill: '#ffffff',
        'fill-opacity': 0,
        "stroke-width": 0,
        stroke: '#ffffff'
    });
    var countries = [];
    var i = 0;
	
	$.get("map.svg", function(d){
		$(d).find('path').each(function(){			
			var $book = $(this); 
			var description = $book.find('desc').text(); 
			var title = $book.find('title').text(); 
			var dat = $book.attr("d");
			var id = $book.attr("id");
			var style = $book.attr("style");
			var singularInstance = {};
			singularInstance.path = dat;
			singularInstance.name = id;
			
			var rx = /^([^\[]*)/gm;
			var arr = rx.exec(title); 
			if (arr != null && arr[1]) {
				singularInstance.title = arr[1];	
				
			}
			
			rx = /\[(.*)\]/gm;
			var arr = rx.exec(title); 
			if (arr != null && arr[1]) {
				singularInstance.options = arr[1];					
			}
			
			
			singularInstance.fill = id;
			singularInstance.detail = description;
			singularInstance.style = style;
			singularInstance.objectp = placeObject(singularInstance);
			countries[i] = singularInstance;
			if (singularInstance.title){
				placeButton(singularInstance);		
			}
			i++;
			
		});
		$(".myButton").click(doButtonPress);
	});	
	
	function placeButton(instance) {
		var element = document.createElement("input");
        //Assign different attributes to the element. 
        element.type = "button";
        element.value = instance.title;
        element.name = instance.title;
        element.className = "myButton";
        element.setAttribute('data-id', i)
        infolist.appendChild(element);
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
		if (arr != null && arr[1] != null) {
			attributes.fill = arr[1];
			obj.data("fill", arr[1]);
		} else {
			obj.data("fill", "#F1F1F1");	
		}
		
        obj.attr(attributes);
        obj.click(handleShapeClick);
		obj.data("hoverFill", "#FA1167");
		
		
		var ops = instance.options;
		if (!ops || !ops.includes("h")){
			obj.hover(animateOver, animateOut);		
		}
		obj.data("id", i);
		
		return obj 
	}
	
	var lastobject = null;
    var doButtonPress = function() {
        var country = countries[$(this).data("id")];
		
		clearlastHighlight();
        if (country.objectp.data("hoverFill")) {
            country.objectp.attr("fill", country.objectp.data("hoverFill"));
        }
		lastobject = country;
		displayDetails(country);
    }
	
	function clearlastHighlight() {
			if (lastobject != null) {
			lastobject.objectp.attr("fill", lastobject.objectp.data("fill"));	
		}			
	}
    
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
        var currentpos = panZoom.getCurrentPosition();
        panZoom.pan(x - currentpos.x, y - currentpos.y);
        var currPaperZoom = panZoom.getCurrentZoom();
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
		clearlastHighlight();
		displayDetails(countries[this.data("id")]);
        if (this.data("hoverFill")) {
            this.attr("fill", this.data("hoverFill"));
        }
    }
    function animateOut() {
		displayDetails(null);
        if (this.data("fill")) {
            this.attr("fill", this.data("fill"));
        }
    }
	
	function displayDetails(obj) {
		if (obj != null) {
			document.getElementById("infoname").innerHTML = obj.title;	
			document.getElementById("infodetail").innerHTML = obj.detail;	
		} 
		else {
			document.getElementById("infoname").innerHTML = "";	
			document.getElementById("infodetail").innerHTML = "";		
		}
	}
    function handleShapeClick() {
		var cntry = countries[this.data("id")];
        displayDetails(cntry);
		
		if (cntry.options != null && cntry.options.includes("b")) {
			//alert("bk");
	
			this.toBack();
			this.attr("fill", "#595959");
			this.data("fill", "#595959");	
		}
        panZoom.enable();
    }
});