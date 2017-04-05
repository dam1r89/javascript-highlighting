
Array.prototype.unique = function() {
    var u = {},
        a = [];
    for (var i = 0, l = this.length; i < l; ++i) {
        if (u.hasOwnProperty(this[i])) {
            continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
    }
    return a;
};



rng = () => {

    sel = getSelection();
    return sel.getRangeAt(0);

}

let counter = 1;
let allCommands = {};

prevent = false;
document.addEventListener('mousedown', function(e) {
    let dataKey = e.target.dataKey;
    if (!dataKey) return;
    let deps = {}
    getDeps(dataKey, deps);
    let batch = Object.keys(deps)
	    .map(x => parseInt(x))
	    .unique()
	    .sort()
	    .filter(x => x >= dataKey)
	    .reverse();
    console.log(batch, allCommands);
    batch.forEach(x => {
		allCommands[x].commands.reverse().forEach(x => x.undo());
		delete allCommands[x];
    });

    prevent = true;
});

function getDeps(key, deps) {

    deps[key] = true;

    allCommands[key].dependency.forEach(d => {
        if (!deps[d]) {
            getDeps(d, deps);
        }
    })

}

document.addEventListener('mouseup', function(e) {

    if (prevent) {
        prevent = false;
        return;
    }

    let key = counter++;
    let commands = [];
    let dependency = [key];

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
        let el = cmd.el;
        if (el.dataKey && el.dataKey != key) {
            dependency.push(el.dataKey);
            allCommands[el.dataKey].dependency.push(key);
        }

    }
    // Highlight start and beginnings
    else {

        let cmd = wrap(start, r.startOffset);
        commands.push(cmd);
        newStart = cmd.el;
        let el = newStart;
        while (
            (el = el.nextSibling ||
                (el.parentElement && el.parentElement.nextSibling))
        ) {
            if (el.dataKey && el.dataKey != key) {
                dependency.push(el.dataKey);
                allCommands[el.dataKey].dependency.push(key);
            }
            if (el == endRoot) break;

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
            (el != r.commonAncestorContainer)
        ) {
            if (el.dataKey && el.dataKey != key) {
                dependency.push(el.dataKey);
                allCommands[el.dataKey].dependency.push(key);
            }
            if (el == newStart || el == startRoot) break;
            if (el.nodeType == 3) {
                cmd = surround(el);
                commands.push(cmd);
                el = cmd.el;
            }
            el.className = 'hl';
        }
    }

    sel.removeAllRanges();
    allCommands[key] = { commands, dependency };

    function wrap(el, index, endIndex) {

        // No need to wrap if not text node
        if (el.nodeType != 3) {
            return {
                el: el,
                undo: () => {}
            };
        }

        if (el.dataKey) {
            dependency.push(el.dataKey);
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
            newEl.dataKey = key;
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
                    delete newEl.dataKey;
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
        newSpan.dataKey = key;
        return {
            el: newSpan,
            undo: () => {
                delete newSpan.dataKey;
                newSpan.parentElement.replaceChild(element, newSpan);
            }
        }


    }


});
