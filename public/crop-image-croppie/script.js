// DECLARE VARIABLES
const upload = document.querySelector("#upload");
const imgContainer = document.querySelector('#croppieContainer');
const croppedImage = document.querySelector('#croppedImage');
const cropButton = document.querySelector('#btnCrop');
const btnRefresh = document.querySelector('#btnRefresh');


// INITIALIZE CROPPIE
var croppieInstance = new Croppie(imgContainer, {
    viewport: { width: 200, height: 200, type: 'square' },
    boundary: { width: 400, height: 400 },
    enableResize: true
});

// HANDLE FILE UPLOAD
upload.addEventListener('change', function (e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        croppieInstance.bind({
            url: event.target.result
        });
    };
    reader.readAsDataURL(file);

    // SHOW PREVIEW AND CROP BUTTON
    imgContainer.style.display = 'block';
    cropButton.style.display = 'block';
});

// HANDLE CROP BUTTON CLICK
cropButton.addEventListener('click', function () {
    croppieInstance.result('canvas').then(function (result) {
        // SHOW CROPPED IMAGE
        croppedImage.src = result;
        croppedImage.style.display = 'block';

        // SHOW REFRESH BUTTON
        btnRefresh.style.display = 'block';

        //HIDE INPUT ELEMENT AND CROPPIE CONTAINER
        imgContainer.style.display = 'none';
        upload.style.display = 'none'
        cropButton.style.display = 'none';
    });
});

// HANDLE REFRESH BUTTON CLICK
btnRefresh.addEventListener('click', function () {
    location.reload();
});