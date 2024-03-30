$(document).ready(function() {
    // Make the subtask list sortable
    $('#sortable').sortable({
        stop: function(event, ui) {
            // Update the subtasks order on the server
            updateSubtasksOrder();
        }
    });

    // Handle delete button click
    $('.delete-btn').click(function() {
        $(this).parent().remove();
        updateSubtasksOrder();
    });

    // Handle delete selected button click
    $('#delete-selected').click(function() {
        $('.subtask-checkbox:checked').closest('.subtask-item').remove();
        updateSubtasksOrder();
    });

    // Function to update the subtasks order on the server
    function updateSubtasksOrder() {
        var subtasks = [];
        $('#sortable li').each(function() {
            subtasks.push($(this).find('.subtask-text').text().trim());
        });

        // Send the updated subtasks order to the server (you'll need to implement this)
        console.log('Updated subtasks:', subtasks);
    }
});