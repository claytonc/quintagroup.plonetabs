/*global $ */
/*jslint white: true */
'use strict';

$.fn.serializeObject = function()
{
    var o = {}, a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

/*COMMON FUNCTIONS*/
function clearStatusMessage() {
  $('#kssPortalMessage').removeClass('info').removeClass('warning').removeClass('error');
}

function initStatusMessage(type, header) {
  $('#kssPortalMessage').addClass(type);
  $('#kssPortalMessage dt').text(header);
}

function setStatusMessage(type, message) {
  clearStatusMessage();
  if (type === 'info') {
    initStatusMessage('info', 'Info');
  } else if (type === 'error') {
    initStatusMessage('error', 'Error');
  } else if (type === 'warning') {
    initStatusMessage('warning', 'Warning');
  }
  $('#kssPortalMessage dd').text(message);
  $('#kssPortalMessage').show();
  //('#kssPortalMessage').show().delay(5000).hide();
}

function parseResponse(response, this_event, formData, handler) {
  if (response.status_code === 200) {
    setStatusMessage('info', response.status_message);
    if (handler) {
      handler(response, this_event, formData);
    }
  } else {
    setStatusMessage('error', response.status_message);
  }
}

function reloadActions(formData) {
    switch(formData.category) {
    case 'portal_tabs':
        $('#portal-globalnav').load(' #portal-globalnav>*');
        break;
    case 'site_actions':
        $('#portal-siteactions').load(' #portal-siteactions>*');
        break;
    case 'user':
        $('#portal-personaltools ul').load(' #portal-personaltools ul>*');
        break;
    default:
        break;
    }
}

function sendRequest(formData, handler, this_event, parse) {
  $.ajax({
    type: 'POST',
    url: '@@plonetabs-controlpanel',
    data: formData,
    dataType: 'json',
    success: function(response) {
      if (parse) {
        parseResponse(response, this_event, formData, handler);
      }
      else if (handler) {
        handler(response, this_event, formData);
      }
      reloadActions(formData);
    },
    error: function() {
      setStatusMessage('error', 'Server connection error. Please try again');
    }
  });
}

function toggle_handler(response) {
  $('#roottabs').html(response.content);
  $('#portal-globalnav').load(' #portal-globalnav>*');
}

//General func for toggleGeneratedTabs and nonfolderish_tabs request
function sendtoggleRequest(field_name, checked_status) {
  var formData = {};
  formData.ajax_request = true;
  formData.field = field_name;
  formData.generated_tabs = checked_status;
  sendRequest(formData, toggle_handler, false, true);
}

function sortableList() {
  var formData = {},
      liIds = $('#tabslist li').map(function(i, n) {
        return $(n).attr('id');
      }).get().join('&');
  formData.ajax_request = true;
  formData.category = $('#select_category').val();
  formData.actions = liIds;
  formData.edit_moveact = 'Move Action';
  sendRequest(formData, false, false, true);
}

function updateSortable() {
  $('#tabslist').unbind();
  $('#tabslist').sortable().bind('sortupdate', function() {sortableList();});
}

function startupActions() {
  $('.add-controls input').addClass('allowMultiSubmit');
  $('.edit-controls input').addClass('allowMultiSubmit');
  $('.collapseAdvanced').removeClass('expandedBlock').addClass('collapsedBlock');
  updateSortable();
}

$(function() {
  $('#plonetabs_form').addClass('kssTabsActive');
  startupActions();
});

function hideErrorMessage() {
  var err, field_name,
      error_fields = ['field-name', 'field-action', 'field-id', 'field-icon', 'field-condition'];
  for (err in error_fields) {
    field_name = 'form[name=addaction_form] .' + error_fields[err];
    $(field_name).removeClass('error');
    $(field_name + ' .error-container').text('');
  }
}

function displayErrorMessage(err_content) {
  var err, field_name,
      error_fields = {'title': 'field-name', 'url_expr': 'field-action', 'id': 'field-id', 'icon_expr': 'field-icon', 'available_expr': 'field-condition'};
  hideErrorMessage();
  for (err in error_fields) {
    if (err_content[err]) {
      field_name = 'form[name=addaction_form] .' + error_fields[err];
      $(field_name).addClass('error');
      $(field_name + ' .error-container').text(err_content[err]);
    }
  }
}

function toggleCollapsible(el, collapse) {
  collapse = collapse === undefined ? 'default' : collapse;

  var node = el.parent('.collapseAdvanced');

  if (collapse !== 'default') {
    if (collapse === true) {
        node.removeClass('expandedBlock');
        node.addClass('collapsedBlock');
    }
    else {
        node.removeClass('collapsedBlock');
        node.addClass('expandedBlock');
    }
  }
  else {
    if (node.hasClass('collapsedBlock')) {
        node.removeClass('collapsedBlock');
        node.addClass('expandedBlock');
    }
    else {
        node.removeClass('expandedBlock');
        node.addClass('collapsedBlock');
    }
  }
}

function clearAddForm() {
  $('#addaction').removeClass('adding');
  toggleCollapsible($('form[name=addaction_form] .headerAdvanced'), true);
  $('form[name=addaction_form]')[0].reset();
  hideErrorMessage();
  $('#kssPortalMessage').hide();
  updateSortable();
}



/*CLIENTS METHODS*/

//titleWrapper
$('#tabslist .titleWrapper').live('click', function() {
    ($(this).closest('li')).addClass('editing');
});

//collapse
$('.collapseAdvanced .headerAdvanced').live('click', function(event) {
    toggleCollapsible($(this));
});

/*RESPONSE HANDLERS*/

function category_handler(response) {
    if (response.status_code === 200) {
        $('form[name=addaction_form] input[name=category]').text($('#select_category').val());
        $('#tabslist').html(response.actionslist);
        $('#autogeneration_section').html(response.section);
        $('#plonetabs-form-title').text(response.title);

        $('#addaction').removeClass('adding');
        toggleCollapsible($('form[name=addaction_form] .headerAdvanced'), true);
        startupActions();
    }
}

function edit_handler(response, this_event) {
  if (response.status_code === 200) {
      setStatusMessage('info', response.status_message);
      $(this_event).closest('li').replaceWith(response.content);
      updateSortable();
  } else {
      setStatusMessage('error', response.status_message);
      toggleCollapsible($(this_event).find('.headerAdvanced'), false);
  }
}

function reset_handler(response, this_event) {
  $(this_event).closest('li').replaceWith(response.content);
  updateSortable();
}

function delete_handler(response, this_event) {
  $(this_event).closest('li').remove();
  updateSortable();
}

function visibility_handler(response, this_event, formData) {
  if (formData.visibility === true) {
      $(this_event).closest('li').removeClass('invisible');
  }
  else {
      $(this_event).closest('li').addClass('invisible');
  }
}

function roottabs_visibility_handler(response, this_event, formData) {
  $('#portal-globalnav').load(' #portal-globalnav>*');
  if (formData.visibility === true) {
      this_event.closest('li').removeClass('invisible');
  }
  else {
      this_event.closest('li').addClass('invisible');
  }
}

function add_handler(response) {
  if (response.status_code === 200) {
    setStatusMessage('info', response.status_message);
    $('#tabslist').append(response.content);
    clearAddForm();
  }
  else {
    setStatusMessage('error', response.status_message);
    toggleCollapsible($('form[name=addaction_form] .headerAdvanced'), false);
    if (response.content) {
      displayErrorMessage(response.content);
    }
  }
}

/*EVENTS*/

//changing category
$('#select_category').live('change', function(event) {
    var formData = {};
    formData.ajax_request = true;
    formData.category = $(this).val();
    formData.category_change = 'Change';
    sendRequest(formData, category_handler, false, false);
});

//save(edit)
$('#tabslist .editsave').live('click', function(event) {
    event.preventDefault();
    var formData = $(this).closest('form').serializeObject();
//     var parentFormSelect = $(this).closest('li');
    formData.edit_save = this.value;
    formData.ajax_request = true;
    sendRequest(formData, edit_handler, $(this), false);
});

//reset(cancel)
$('#tabslist .editcancel').live('click', function(event) {
    event.preventDefault();
    var formData = {}, parentFormSelect = $(this).closest('li');
    formData.ajax_request = true;
    formData.edit_cancel = 'Cancel';
    formData.orig_id = parentFormSelect.find('.editform input[name="orig_id"]').val();
    formData.category = parentFormSelect.find('.editform input[name="category"]').val();
    sendRequest(formData, reset_handler, $(this), true);
});

//delete
$('#tabslist .delete').live('click', function(event) {
    event.preventDefault();
    var formData = {}, parentFormSelect = $(this).closest('li');
    formData.ajax_request = true;
    formData.edit_delete = 'Delete';
    formData.orig_id = parentFormSelect.find('.editform input[name="orig_id"]').val();
    formData.category = parentFormSelect.find('.editform input[name="category"]').val();
    sendRequest(formData, delete_handler, $(this), true);
});

//visibility
$('#tabslist input.visibility').live('click', function(event) {
    var formData = {}, parentFormSelect = $(this).closest('li');
    formData.ajax_request = true;
    formData.tabslist_visible = 'Set visibillity';
    formData.orig_id = parentFormSelect.find('.editform input[name="orig_id"]').val();
    formData.category = parentFormSelect.find('.editform input[name="category"]').val();
    formData.visibility = $(this).is(':checked');
    sendRequest(formData, visibility_handler, $(this), true);
});

//portal_tabs methods

//visibility
$('#roottabs .visibility').live('click', function(event) {
    var formData = {}, parentFormSelect = $(this).closest('li');
    formData.ajax_request = true;
    formData.roottabs_visible = 'Visibillity';
    formData.orig_id = parentFormSelect.attr('id');
    formData.visibility = $(this).is(':checked');
    sendRequest(formData, roottabs_visibility_handler, $(this), true);
});

//toggleGeneratedTabs
$('#generated_tabs').live('click', function() {
    var field_name = 'disable_folder_sections',
        checked_status = $(this).is(':checked');
    sendtoggleRequest(field_name, checked_status);
});

//nonfolderish_tabs
$('#nonfolderish_tabs').live('click', function() {
    var field_name = 'disable_nonfolderish_sections',
        checked_status = $(this).is(':checked');
    sendtoggleRequest(field_name, checked_status);
});

//Add new action methods

//focus
$('#actname').live('focus', function() {
    $('#addaction').addClass('adding');
});

//cancel
$('#buttoncancel').live('click', function(event) {
    event.preventDefault();
    clearAddForm();
});

//add
$('#buttonadd').live('click', function(event) {
    event.preventDefault();
    var formData = $(this).closest('form').serializeObject();
    formData.add_add = this.value;
    formData.ajax_request = true;
    formData.category = $('#select_category').val();
    sendRequest(formData, add_handler, false, false);
});
