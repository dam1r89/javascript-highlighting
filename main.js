rng = () => {

    sel = getSelection();
    if (sel.type == "Range") {
        return sel.getRangeAt(0);
    }

}

let commands = [];

document.addEventListener('mouseup', function(e) {

    let hasClass = e.target.className.match(/\bhl\b/)
    if (hasClass) {
    		
    };

    let r = rng();
    if (!r) return;

    let start = r.startContainer,
        end = r.endContainer,
        startRoot = start,
        current = start;


    // find possition 
    while (current != r.commonAncestorContainer) {
        startRoot = current;
        current = current.parentElement;
    }

    let endRoot = end;

    current = end;

    while (current != r.commonAncestorContainer) {
        endRoot = current;
        current = current.parentElement;
    }


    // Highlight middle
    if (start == end) {
        let cmd = wrap(start, r.startOffset, r.endOffset);
        commands.push(cmd);

    }
    // Highlight start and beginnings
    else {


        let cmd = wrap(start, r.startOffset);
        commands.push(cmd);
		newStart = cmd.el;
        let el = newStart;
        while (
            (el = el.nextSibling ||
                (el.parentElement && el.parentElement.nextSibling)) &&
            (el != endRoot)
        ) {
            if (el.nodeType == 3) {
                cmd = surround(el);
                commands.push(cmd);
                el = cmd.el;
            }
            el.className = 'hl';
        }

        cmd = wrap(end, 0, r.endOffset);
        commands.push(cmd);
        el = cmd.el;
        while (
            (el = el.previousSibling || (el.parentElement && el.parentElement.previousSibling)) &&
            (el != r.commonAncestorContainer) &&
            (el != newStart && el != startRoot)
        ) {
            if (el.nodeType == 3) {
                cmd = surround(el);
                commands.push(cmd);
                el = cmd.el;
            }
            el.className = 'hl';
        }
        window.commands = commands
    }

    sel.removeAllRanges();


});

function wrap(el, index, endIndex) {

    // No need to wrap if not text node
    if (el.nodeType != 3) {
        return {
        	el: el,
        	undo: () => {}
        };
    }

    let start = el.nodeValue.substr(0, index);
    let startElement = document.createTextNode(start);

    let mid = el.nodeValue.substr(index, endIndex ? endIndex - index : undefined);
    let midElement = document.createElement('span');
    midElement.className = 'hl';
    midElement.appendChild(document.createTextNode(mid));

    let end = el.nodeValue.substr(endIndex)
    let endElement = endIndex ? document.createTextNode(end) : undefined;


    // Replace split elements instead of old text
    let newElms = [startElement, midElement, endElement].filter(x => !!x).reverse();

    let parent = el.parentElement;
    newElms.forEach((newEl, ind) => {
        if (ind === 0) {
            parent.replaceChild(newEl, el);
        } else {
            parent.insertBefore(newEl, newElms[ind - 1]);
        }
    });

    return {
    	el: midElement,
    	undo: () => {
		    newElms.forEach((newEl, ind) => {
		        if (ind === 0) {
		            parent.replaceChild(el, newEl);
		        } else {
		            parent.removeChild(newEl);
		        }
		    });
    	}
    };

}

function surround(element) {


    var newSpan = document.createElement('span');
    newSpan.appendChild(document.createTextNode(element.nodeValue));
    element.parentElement.replaceChild(newSpan, element);
    return {
        el: newSpan,
        undo: () => {
            newSpan.parentElement.replaceChild(element, newSpan);
        }
    }


}
