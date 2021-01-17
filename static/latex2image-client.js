var sampleEquation = '\\frac{\\pi}{2} = \\int_{-1}^{1} \\sqrt{1-x^2}\\ dx';
var hasShownBefore = false;

var ENDPOINT = '/convert';

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
    var latexInput = $('#latexInputTextArea').val();

    if (!latexInput) {
      show({ error: 'No LaTeX input provided.' });
      return;
    }

    if ($('#autoAlignCheckbox').prop('checked')) {
      latexInput = '\\begin{align*}\n' + latexInput + '\\end{align*}\n';
    }

    $('#result').slideUp(hasShownBefore ? 330 : 0, function() {
      $('#resultImage').attr('src', '');
    });

    $('#convertButton').prop('disabled', true);
    $('#exampleButton').prop('disabled', true);
    $('#convertButtonText').html('Converting...');
    $('#convertSpinner').removeClass('d-none');
    $.ajax({
      url: ENDPOINT,
      type: 'POST',
      data: {
        latexInput: latexInput,
        outputFormat: $('#outputFormatSelect').val(),
        outputScale: $('#outputScaleSelect').val()
      },
      success: function(data) {
        $('#convertButton').prop('disabled', false);
        $('#exampleButton').prop('disabled', false);
        $('#convertButtonText').html('Convert');
        $('#convertSpinner').addClass('d-none');
        show(data);
      },
      error: function() {
        $('#convertButton').prop('disabled', false);
        $('#exampleButton').prop('disabled', false);
        $('#convertButtonText').html('Convert');
        $('#convertSpinner').addClass('d-none');
        alert('Error communicating with server');
      }
    });
  });

  // Show and convert a sample equation
  $('#exampleButton').click(function() {
    $('#latexInputTextArea').val(sampleEquation);
    $('#autoAlignCheckbox').prop('checked', true);
    $('#convertButton').click();
  });
});
