/*
    Drag and drop reordering of plone tabs items.

    Provides global plonetabsDnDReorder
*/


/*jslint nomen:false */

var plonetabsDnDReorder = {};

plonetabsDnDReorder.dragging = null;
plonetabsDnDReorder.container = null;
plonetabsDnDReorder.items = null;
plonetabsDnDReorder.locked = false;
plonetabsDnDReorder.handler = null;


(function($) {

plonetabsDnDReorder.doDown = function(e) {
    var dragging = plonetabsDnDReorder.dragging,
        body;
    // Waiting for a server operation to complete or following an error
    if (plonetabsDnDReorder.locked) {return;}
    // already dragging, probably catching up a lost drag.
    if (dragging) {
        if ($(this).attr('id') !== dragging.attr('id')) {
            plonetabsDnDReorder.locked = true;
            dragging.removeClass('dragging').addClass('error');
        }
        return;
    }
    dragging = $(this).parents('li:first');
    if (!dragging.length) {return;}
    plonetabsDnDReorder.items.mousemove(plonetabsDnDReorder.doDrag);
    body = $('body');
    body.mouseup(plonetabsDnDReorder.doUp);
    body.mouseleave(plonetabsDnDReorder.doCancel);

    plonetabsDnDReorder.dragging = dragging;
    dragging.data('plonetabsDnDReorder.startPosition', plonetabsDnDReorder.getPos(dragging));
    dragging.addClass('dragging');
    $(this).parents('li').addClass('dragindicator');
    // Find the original subset ids. This must be in the current order.
    dragging.data('plonetabsDnDReorder.subset_ids', $.map(
        plonetabsDnDReorder.container.find('.drag-handle'),
        function(elem) {
            return $(elem).attr('id').substr('folder-contents-item-'.length);
    }));
    return false;
};

plonetabsDnDReorder.getPos = function(node) {
    var pos = node.parent().children('li').index(node[0]);
    return pos === -1 ? null : pos;
};

plonetabsDnDReorder.doDrag = function(e) {
    var dragging = plonetabsDnDReorder.dragging,
        target = this;

    if (!dragging) {return;}
    if (!target) {return;}

    if ($(target).attr('id') !== dragging.attr('id')) {
        plonetabsDnDReorder.swapElements($(target), dragging);
    }
    return false;
};

plonetabsDnDReorder.swapElements = function(child1, child2) {
    var parent = child1.parent(),
        items = parent.children('[id]'),
        t;

    // Only adjacent elements may be swapped.
    if (Math.abs(plonetabsDnDReorder.getPos(child1) - plonetabsDnDReorder.getPos(child2)) !== 1) {
        return;
    }

    items.removeClass('even').removeClass('odd');
    if (child1[0].swapNode) {
        // IE proprietary method
        child1[0].swapNode(child2[0]);
    } else {
        // swap the two elements, using a textnode as a position marker
        t = parent[0].insertBefore(document.createTextNode(''),
                                       child1[0]);
        child1.insertBefore(child2);
        child2.insertBefore(t);
        $(t).remove();
    }
    // odd and even are 0-based, so we want them the other way around
    parent.children('[id]:odd').addClass('even');
    parent.children('[id]:even').addClass('odd');
};

plonetabsDnDReorder.doUp = function(e) {
    var dragging = plonetabsDnDReorder.dragging,
        body = $('body');
    if (!dragging) {return;}

    plonetabsDnDReorder.updatePositionOnServer();
    dragging.removeData('plonetabsDnDReorder.startPosition');
    dragging.removeData('plonetabsDnDReorder.subset_ids');
    plonetabsDnDReorder.items.unbind('mousemove', plonetabsDnDReorder.doDrag);
    body.unbind('mouseup', plonetabsDnDReorder.doUp);
    body.unbind('mouseleave', plonetabsDnDReorder.doCancel);

    $(this).parents('li').removeClass('dragindicator');
    return false;
};

plonetabsDnDReorder.doCancel = function(e) {
    var dragging = plonetabsDnDReorder.dragging,
        body = $('body');
    if (!dragging) {return;}

    dragging.removeClass('dragging');
    // Need to remove the indicator as well, important in the
    // case when the mouse up occurs outside the grid.
    dragging.removeClass('dragindicator');

    if (plonetabsDnDReorder.getPos(dragging) - dragging.data('plonetabsDnDReorder.startPosition')) {
        // position has changed, error out
        plonetabsDnDReorder.locked = true;
        dragging.addClass('error');
    }
    plonetabsDnDReorder.items.unbind('mousemove', plonetabsDnDReorder.doDrag);
    body.unbind('mouseup', plonetabsDnDReorder.doCancel);
    body.unbind('mouseleave', plonetabsDnDReorder.doCancel);
    plonetabsDnDReorder.dragging = null;

    return false;
};

plonetabsDnDReorder.updatePositionOnServer = function() {
    var dragging = plonetabsDnDReorder.dragging,
        delta,
        args,
        encoded;

    if (!dragging) {return;}

    delta = plonetabsDnDReorder.getPos(dragging) - dragging.data('plonetabsDnDReorder.startPosition');

    if (delta === 0) {
        // nothing changed
        // Do not just leave: need to cancel.
        // ... or, up to big surprise at next click.
        plonetabsDnDReorder.doCancel.call();
        return;
    }
    if (plonetabsDnDReorder.handler) {
        plonetabsDnDReorder.locked = true;
        plonetabsDnDReorder.handler(plonetabsDnDReorder.complete);
    } else {
        plonetabsDnDReorder.complete({status_code: 200});
    }
};

plonetabsDnDReorder.complete = function(responce) {
    var dragging = plonetabsDnDReorder.dragging;
    dragging.removeClass('dragging');
    // Need to remove the indicator as well, important in the
    // case when the mouse up occurs outside the grid.
    dragging.removeClass('dragindicator');
    if (responce.status_code === 200) {
        plonetabsDnDReorder.locked = false;
    } else {
        dragging.addClass('error');
    }
    plonetabsDnDReorder.dragging = null;
};

}(jQuery));


function initializeplonetabsDnDReorder(container_selector, handler) {
    var container = container_selector;
    plonetabsDnDReorder.container = $(container);
    plonetabsDnDReorder.handler = handler;
    if (!plonetabsDnDReorder.container.length)
        return;
    plonetabsDnDReorder.locked = false;
    plonetabsDnDReorder.dragging = null;
    plonetabsDnDReorder.items = $(container + ' > li');
    $(container + ' > li .drag-handle')
       .mousedown(plonetabsDnDReorder.doDown)
       .mouseup(plonetabsDnDReorder.doUp)
       .addClass('draggingHook')
       .css('cursor', 'ns-resize');
}
