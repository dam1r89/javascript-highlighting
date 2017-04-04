rng = () => {

    sel = getSelection();
    if (sel.type == "Range") {
        return sel.getRangeAt(0);
    }

}

document.addEventListener('mouseup', function() {

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

    // Highlight between elements
    let next = startRoot.nextSibling;
    while(startRoot != endRoot &&next && next != endRoot){
    	let el = next;
    	next = next.nextSibling;
    	if (el.nodeType == 3){
    		el = surround(el);	
    	}
		el.className = 'hl';
    }


    // Highlight middle
    if (start == end) {
	    wrap(start, r.startOffset, r.endOffset);
    }
    // Highlight start and beginnings
    else {
    	wrap(start, r.startOffset);
    	wrap(end, 0, r.endOffset);	
    }


});

function wrap(el, index, endIndex){

	let start = el.nodeValue.substr(0, index);
	let startElement = document.createTextNode(start);

	let mid = el.nodeValue.substr(index, endIndex ? endIndex - index : undefined);
	let midElement = document.createElement('span');
	midElement.className = 'hl';
	midElement.appendChild( document.createTextNode(mid) );

	let end =  el.nodeValue.substr(endIndex)
	let endElement = endIndex ? document.createTextNode(end) : undefined;


	// Replace split elements instead of old text
	let newElms = [startElement, midElement, endElement].filter(x => !!x).reverse();

	let parent = el.parentElement;
	newElms.forEach((newEl, ind) => {
		if (ind === 0){
			parent.replaceChild( newEl, el );
		}
		else {
			parent.insertBefore(newEl, newElms[ind - 1]);
		}
	});

	// return midElement;

}

function surround(element){

	console.log('surrounding', element.nodeValue);
    var newSpan = document.createElement('span');
	// Append "Lorem Ipsum" text to new span:
	newSpan.appendChild( document.createTextNode(element.nodeValue) );

	// Replace old text node with new span:
	element.parentElement.replaceChild( newSpan, element );
	return newSpan;

}
