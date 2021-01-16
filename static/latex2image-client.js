var sampleEquation = '\\frac{\\pi}{2} = \\int_{-1}^{1} \\sqrt{1-x^2}\\ dx';
var hasShownBefore = false;

$(document).ready(function() {
  function show(resultData) {
    function afterSlideUp() {
      var resultDataJSON;
      if ((resultDataJSON = JSON.parse(resultData)) && !resultDataJSON.error) {
        $('#resultImage').attr('src', resultDataJSON.imageURL);
        $('#downloadButton').attr('href', resultDataJSON.imageURL);
        $('#resultCard').show();
        $('#errorAlert').hide();
      } else {
        $('#errorAlert').text(resultDataJSON.error || 'Invalid response received');
        $('#errorAlert').show();
        $('#resultCard').hide();

      }
      $('#result').slideDown(330);

      // Scroll window to bottom
      $("html, body").animate({
        scrollTop: $(document).height()
      }, 1000);

      hasShownBefore = true;
    }

    $('#result').slideUp(hasShownBefore ? 330 : 0, afterSlideUp);
  }

  $('#convertButton').click(function() {
    if (!$('#latexInputTextArea').val()) {
      show(JSON.stringify({
        error: 'No LaTeX input provided'
      }));
      return;
    }

    $('#result').slideUp(hasShownBefore ? 330 : 0, function() {
      $('#resultImage').attr('src', '');
    });

    $('#convertButton').prop('disabled', true);
    $('#exampleButton').prop('disabled', true);
    $('#convertButton').prop('value', 'Converting...');
    $.ajax({
      url: '/convert',
      type: 'POST',
      data: {
        latexInput: $('#latexInputTextArea').val(),
        outputFormat: $('#outputFormatSelect').val(),
        outputScale: $('#outputScaleSelect').val()
      },
      success: function(data) {
        $('#convertButton').prop('disabled', false);
        $('#exampleButton').prop('disabled', false);
        $('#convertButton').prop('value', 'Convert');
        show(data);
      },
      error: function() {
        $('#convertButton').prop('disabled', false);
        $('#exampleButton').prop('disabled', false);
        $('#convertButton').prop('value', 'Convert');
        alert('Error communicating with server');
      }
    });
  });

  // Show and convert a sample equation
  $('#exampleButton').click(function() {
    $('#latexInputTextArea').val(sampleEquation);
    $('#convertButton').click();
  });
});
