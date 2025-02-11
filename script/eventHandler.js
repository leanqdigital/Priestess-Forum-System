///////////////////////////////////////////////////////////////
// TYPEDEFS
// Used for documentation
///////////////////////////////////////////////////////////////
/**
 * @typedef ontraportS3UploadParams
 * @type {Object}
 * @description
 * The Object returned from the `getS3UploadParams()`
 * function (Step 1 in this file). This Object
 * represents the pre-signed URL data to use
 * when uploading files to Amazon S3.
 *
 * @property {ontraportS3UploadParamsAttributes} attributes - See
 * the [ontraportS3UploadParamsAttributes typedef]{@link ontraportS3UploadParamsAttributes}.
 *
 * @property {ontraportS3UploadParamsInputs} inputs - See
 * the [ontraportS3UploadParamsInputs typedef]{@link ontraportS3UploadParamsInputs}.
 */

/**
 * @typedef ontraportS3UploadParamsAttributes
 * @type {Object}
 * @description
 * The `attributes` key of the `ontraportS3UploadParams`
 * Object returned from the `getS3UploadParams()` function.
 *
 * This is part of the pre-signed URL data.
 *
 * @property {string} action - The URL to post the files to.
 *
 * @property {string} enctype - The encoding type for
 * the form, typically "multipart/form-data".
 *
 * @property {string} method - The type of request to
 * perform, typically "POST".
 */

/**
 * @typedef ontraportS3UploadParamsInputs
 * @type {Object}
 * @description
 * The `inputs` key of the `ontraportS3UploadParams`
 * Object returned from the `getS3UploadParams()` function
 * (Step 1 in this file).
 *
 * This is part of the pre-signed URL data.
 *
 * @property {string} key - The format to use to create the
 * filename.
 *
 * It will contain a "_${filename}" portion that is
 * replaced with the actual filename.
 *
 * Example:
 * "257135_67a8cdc64ff1d8.35985498_${filename}"
 *
 * The `createS3FileId()` helper function in this file
 * can be used to perform the replacement.
 *
 * The resulting filename will be included in the JSON
 * Object that is ultimately submitted for the "file" type field
 * to the Ontraport API once the file upload is complete. It
 * will be the `s3_id` property.
 *
 * @property {{ "Policy": string, "X-Amz-Algorithm": string, "X-Amz-Credential": string, "X-Amz-Date": string, "X-Amz-Signature": string, "key": string }}
 *
 * @property {string} Policy - A long hash string
 *
 * @property {string} X-Amz-Algorithm - The type of encoding
 * that is used. Typically, "AWS4-HMAC-SHA256".
 *
 * @property {string} X-Amz-Credential - The credential authorizing
 * the upload.
 *
 * @property {string} X-Amz-Date - The date signature
 *
 * @property {string} X-Amz-Signature - The encoded signature
 */

/**
 * @typedef ontraportFileUploadData
 * @typedef Object
 * @description
 * The Object containing the details for a
 * file that needs to be uploaded, as well as
 * the Ontraport field it is associated with
 * if applicable.
 *
 * If for some reason you only want to upload a
 * file to the account's Amazon bucket without
 * associating it with a field, you can omit
 * the `fieldName`.
 *
 * @property {string} [fieldName] - The internal name of the
 * Ontraport field (not its "alias")
 * that the upload is associated with.
 *
 * For example, "f2024".
 *
 * The field should be of type "file" in Ontraport.
 *
 * This is optional in case you only want to
 * upload a file for some reason, but skip associating
 * it with a particular field.
 *
 * @property {Object} file - The "file" details retrieved
 * from the file input DOM element.
 *
 * Example: `fileInputElement.files[0]`.
 *
 * At a minimum it must contain:
 *
 * - name - `string` (name of the file, ex: "myImage.png")
 * - type - `string` (MIME type, ex: "image/png")
 */

/**
 * @typedef ontraportFileFieldApiData
 * @type {Object}
 * @description
 * The Object that is ultimately submitted to the
 * Ontraport API for a file field once the file
 * has been uploaded to Amazon.
 *
 * @property {string} name - The original name of the
 * file as submitted by the User.
 *
 * @property {string} type - The file MIME type. Example "image/png".
 *
 * @property {string} s3_id - The unique encoded name of the
 * file (its name in Amazon). This is the value created by the
 * `createS3FileId()` helper function available in this file.
 */

///////////////////////////////////////////////////////////////
// HELPER FUNCTIONS
//
// You might not use all of these, but I reference them in
// the actual steps outlined in the "STEPS" section.
///////////////////////////////////////////////////////////////
/**
 * The `awsParam` passed in the POST request to `/s/aws`
 * to get a pre-signed URL is retrieved from `window.awsParam`
 * on an Ontraport page. They inject it into the rendered page.
 *
 * It is a base64-encoded string, which decodes to
 * a serialized PHP Array (yeah I know, makes no sense).
 *
 * The only part that you really need is the `hash`
 * portion. The other property, `expiry`, can be calculated
 * on-demand, which is what the `encodeAwsParam()` helper
 * function will do for you (it's available in this file).
 *
 * Therefore, if you need to perform file uploads
 * outside an Ontraport page, you can still do so.
 * Simply use this function on an Ontraport page or
 * call it with the `awsParam` you get from an Ontraport page.
 * Then, save the `hash` property from the Object it returns.
 *
 * When you want to upload a file, pass that `hash` value to
 * the `encodeAwsParam()` helper function (available in this file).
 * It will create the proper `awsParam`
 * value to use in the POST request to `/s/aws`.
 * @param {string} [awsParam = window.awsParam] - Optionally
 * provide it, otherwise it will be assumed you're calling this
 * function from within an Ontraport page, and it will use
 * `window.awsParam`.
 *
 * Example string:
 * 'YToyOntzOjQ6Imhhc2giO3M6MzI6IjkzYmU1YTdmOWQ1ZmFjMTdkZmNjNWM5OTg3MDE1NGE0IjtzOjY6ImV4cGlyeSI7aToxNzM5MTk2Nzg1O30='
 *
 * @returns {{ expiry: ?number, hash: ?string }}
 * The decoded `awsParam` Object. All properties will
 * be available unless you provide an invalid `awsParam`.
 * That's the only reason they're documented as being
 * potentially `null`.
 */
function decodeAwsParam(awsParam) {
  if (!awsParam) {
    awsParam = window.awsParam;
  }
  // Decode base64.
  // The decoded string will look like this (serialized PHP Array):
  // a:2:{s:4:"hash";s:32:"93be5a7f9d5fac17dfcc5c99870154a4";s:6:"expiry";i:1739195884;}
  const serializedString = atob(awsParam);

  // Extract hash portion from serialized PHP array, which
  // is the `s:32:` property in the example decoded string above.
  const hashMatch = serializedString.match(/s:\d+:"([a-f0-9]+)"/);

  // Extract expiry portion from serialized PHP array, which
  // is the `i:` property in the example decoded string above.
  const expiryMatch = serializedString.match(/i:(\d+)/);

  return {
    hash: hashMatch ? hashMatch[1] : null,
    expiry: expiryMatch ? parseInt(expiryMatch[1], 10) : null,
  };
}

/**
 * The reverse of the `decodeAwsParam()` helper function that
 * will create the `awsParam` to use in the POST request
 * to `/s/aws` to retrieve a pre-signed URL.
 *
 * This function is only necessary if you are performing an
 * upload outside an Ontraport page and `window.awsParam`
 * is not available.
 *
 * @param {string} hash - The `hash` property from the
 * Object returned from `decodeAwsParam()` helper function.
 * @param {number} [currentEpoch] - The optional unix timestamp
 * (in seconds, not milliseconds) to use when calculating the `expiry`
 * property of the `awsParam` generated by this function.
 *
 * This is only necessary if you're concerned that the users
 * visiting your page have their system time set to something
 * way wrong (highly unlikely).
 *
 * The expiry property that Ontraport uses when embedding
 * the `awsParam` into the Ontraport page provides a
 * 24-hour window. So if the user's system clock
 * is off by even 20+ hours, it will still be fine.
 * It's only an issue if they've set it to something
 * more than 24 hours off.
 *
 * If you have that concern, you can post to any
 * clock api to retrieve the real time, and provide the
 * unix timestamp to this function, which it will then
 * use to determine the correct expiry, rather than
 * using `Math.round(Date.now() / 1000)`.
 * @returns {string}
 * The `awsParam` as a base64 encoded string.
 */
function encodeAwsParam(hash, currentEpoch) {
  if (typeof currentEpoch !== "number") {
    currentEpoch = Math.round(Date.now() / 1000);
  }
  const expiry = new Date(currentEpoch * 1000);
  // I'm only adding 12 hours, rather than 24 hours,
  // to allow the user's system time to be off by
  // +/- 12 hours.
  expiry.setTime(expiry.getTime() + 12 * 60 * 60 * 1000);
  return btoa(
    `a:2:{s:4:"hash";s:${hash.length}:"${hash}";s:6:"expiry";i:${Math.round(
      expiry.getTime() / 1000
    )};}`
  );
}

/**
 * Creates the unique name to use for a file. This
 * gets provided to Amazon, and is also submitted to Ontraport
 * as `s3_id`.
 * @param {string} key - The value of `ontraportS3UploadParamsInputs.key`,
 * see the [ontraportS3UploadParamsInputs typedef]{@link ontraportS3UploadParamsInputs}
 * @param {string} filename - The original name of the file as
 * submitted by the User.
 */
function createS3FileId(key, filename) {
  return `${key.replace("_${filename}", "")}_${filename}`;
}

//////////////////////////////////////////////////////////////
// STEPS
//
// These are the steps (in order) that you follow to
// perform a file upload.
/////////////////////////////////////////////////////////////

/**
 * Step 1: Retrieve Pre-Signed AWS details.
 *
 * This function performs the POST request to `/s/aws`
 * (or the provided `url`, if it is somehow different).
 *
 * @param {string} [awsParam = window.awsParam] - The
 * `awsParam` is available via `window.awsParam` if
 * calling this function within an Ontraport page.
 *
 * For uploads outside an Ontraport page, see
 * the following helper functions for details (included in this file):
 *
 * - decodeAwsParam() - Retrieve the account hash
 * - encodeAwsParam() - Encode the awsParam given the account hash
 *
 * @param {string} [url] - The URL to use in the POST request.
 *
 * Defaults to `//${window.location.host}/s/aws`.
 *
 * I'm not entirely clear on how Ontraport hijacks your domain
 * to add the `/s/aws` endpoint, so this function accepts a
 * URL in case that is somehow different for an account.
 *
 * But it appears to be standard, since I see that your
 * uploads from `awesomate.pro` also use the same
 * default: `awesomate.pro/s/aws`.
 *
 * I'm guessing at the very least the host must be
 * same origin, since I highly doubt they've configured
 * CORS, they definitely don't for other API requests.
 *
 * @returns {Promise.<?ontraportS3UploadParams>}
 * The data to include for each file you need to upload to Amazon.
 *
 * See the [ontraportS3UploadParams typedef]{@link ontraportS3UploadParams}
 * for details.
 *
 * It will only return `null` if an Error occurs. You can
 * modify this function as you see fit to handle the errors.
 * I just don't know what errors could occur, it took me
 * forever to map out the errors for API requests.
 */
function getS3UploadParams(awsParam, url) {
  if (typeof awsParam !== "string") {
    awsParam = window.awsParam;
  }
  if (typeof url !== "string") {
    url = `//${window.location.host}/s/aws`;
  }
  const formData = new FormData();
  formData.append("awsParam", JSON.stringify(awsParam));
  return fetch(url, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((object) => {
      if (object.code === 0 && object.data) {
        console.log("object data is", object.data);
        return object.data;
      }
      /*
       * I don't know how you want to handle errors,
       * and also I have no clue what possible error
       * responses Ontraport will provide. It took me
       * forever to map them out for regular API
       * requests...
       *
       * Your best bet is to just wait a beat and
       * try again.
       */
      return null;
    });
  // Uncomment to implement your own error handling process.
  // .catch(e => {})
}

/**
 * Step 2 - Upload the files
 * @param {Array.<ontraportFileUploadData>} filesToUplaod - An
 * Array containing the details of each file that needs
 * to be uploaded to Amazon.
 *
 * These *should* each have a unique field associated
 * with them, but that's not required. For example,
 * if you just want to upload a bunch of files.
 *
 * See the [ontraportFileUploadData typedef]{@link ontraportFileUploadData}
 * for details.
 * @param {ontraportS3UploadParams} s3Params - The Object
 * returned from `getS3UploadParams()` (step 1).
 *
 * See the [ontraportS3UploadParams typedef]{@link ontraportS3UploadParams}
 * for details on the shape of the Object.
 *
 * @param {Object} [toSubmit] - Optionally provide the Object
 * that will be submitted to the Ontraport API, and it will
 * be appended with the correct value to provide for
 * each file upload field represented in `filesToUpload`.
 *
 * Any entries in `filesToUpload` that do not contain
 * the `fieldName` property will not be added to
 * this Object.
 * @returns {Promise.<Array.<?ontraportFileFieldApiData>>}
 * A Promise that resolves to an Array of Objects in
 * the same order as the `filesToUpload` Array. These
 * are the Objects to submit to the Ontraport API as
 * you normally would for fields that don't require
 * a file upload.
 *
 * A `null` entry indicates that particular file
 * failed to upload. The exact file can be determined
 * by accessing the same index in the
 * provided `filesToUpload` Array.
 */
function uploadFiles(filesToUpload, s3Params, toSubmit) {
  console.log(s3Params, "s3Params");
  const paramsInputs = s3Params.inputs;
  const method = s3Params.attributes.method;
  const action = s3Params.attributes.action;
  const uploadPromises = filesToUpload.map(({ file, fieldName }) => {
    return new Promise((resolve) => {
      let s3FormData = new FormData();

      // Append all required S3 fields
      for (const key in paramsInputs) {
        s3FormData.append(key, paramsInputs[key]);
      }
      // Append the actual file
      s3FormData.append("Content-Type", file.type);
      s3FormData.append("file", file, file.name);

      let xhr = new XMLHttpRequest();
      xhr.open(method, action);

      xhr.onloadend = function () {
        if (xhr.status === 204) {
          let s3Id = createS3FileId(paramsInputs.key, file.name);
          const result = {
            name: file.name,
            type: file.type,
            s3_id: s3Id,
          };
          if (toSubmit && fieldName) {
            toSubmit[fieldName] = JSON.stringify(result);
          }
          resolve(result);
        } else {
          console.error("File upload failed", xhr.statusText);
          resolve(null);
        }
      };

      xhr.send(s3FormData);
    });
  });

  return Promise.all(uploadPromises);
}

////////////////////////////////////////////////////////////////
// Do it all with 1 function
//
// While each step is outlined with separate functions,
// you can also just call this function, and it'll handle
// everything.
////////////////////////////////////////////////////////////////
/**
 * I've combined everything into this single function
 * so that you can just call this if you'd rather, instead
 * of doing step 1 and step 2 separately.
 *
 * It'll add the correct result to `toSubmit`, and
 * all you need to do is submit `toSubmit` once
 * this function completes.
 * @param {Object} toSubmit - The Object to populate
 * with the value to submit for each file type field
 * represented in `filesToUpload`. This is the Object
 * you will ultimately submit to the Ontraport API.
 * @param {Array.<ontraportFileUploadData>} filesToUpload - The
 * Array containing Objects representing each file type
 * field that has a file to upload.
 * @param {string} [awsParamHash = window.awsParam] - See
 * the `getS3UploadParams()` function (step 1) for details.
 *
 * If a `string` (hash) is provided as described in that function, this
 * function will first encode the string using the
 * `encodeAwsParam()` helper function (available in this file)
 * before calling the `getS3UploadParams()` function.
 *
 * DO NOT provide `window.awsParam`, a string will be
 * interpreted as the hash portion, not the
 * full param.
 * @param {string} [awsParamUrl] - The URL to post to
 * that returns the pre-signed URL details to use when
 * uploading to Ontraport. See the
 * `getS3UploadParams()` function (step 1) for details.
 * @returns {Promise.<Object>}
 * A Promise that resolves to the `toSubmit` Object
 * once all files have been uploaded and the
 * necessary data has been added to it for
 * file type fields.
 *
 * If an upload fails, an Error will be thrown with
 * a `failures` Array, which will contain the entries
 * from `filesToUpload` that failed to upload.
 */

function processFileFields(toSubmit, filesToUpload, awsParamHash, awsParamUrl) {
  let awsParam;
  if (!awsParamHash) {
    awsParam = window.awsParam;
  } else if (typeof awsParamHash === "string") {
    awsParam = encodeAwsParam(awsParamHash);
  }

  return getS3UploadParams(awsParam, awsParamUrl).then((s3Params) => {
    if (!s3Params) {
      const e = new Error("Failed to retrieve s3Params.");
      e.failures = filesToUpload;
      throw e;
    }
    return uploadFiles(filesToUpload, s3Params, toSubmit).then((result) => {
      let error;
      for (let i = 0; i < result.length; i++) {
        if (!result[i]) {
          if (!error) {
            error = new Error("One or more files failed to upload.");
            error.failures = [];
          }
          error.failures.push(filesToUpload[i]);
        }
      }
      if (error) {
        throw error;
      }
      return toSubmit;
    });
  });
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => MentionManager.init());

// Trigger file inputs when the corresponding button is clicked
document.getElementById("upload-image-button").addEventListener("click", () => {
  document.getElementById("post-image-upload").click();
});
document.getElementById("upload-audio-button").addEventListener("click", () => {
  document.getElementById("post-audio-upload").click();
});
document.getElementById("upload-video-button").addEventListener("click", () => {
  document.getElementById("post-video-upload").click();
});

// Global variable to track which file type was uploaded ("image", "audio", or "video")
let currentFileType = null;

/**
 * Helper: Shows the refresh and clear controls and hides the three upload buttons.
 * @param {string} fileType - "image", "audio", or "video"
 */
function showFileControls(fileType) {
  currentFileType = fileType;
  // Hide the three separate upload buttons
  document.getElementById("upload-image-button").classList.add("hidden");
  document.getElementById("upload-audio-button").classList.add("hidden");
  document.getElementById("upload-video-button").classList.add("hidden");
  // Show the controls container (refresh & clear)
  document.getElementById("file-controls").classList.remove("hidden");
}

// -------------------------
// File Input Event Listeners
// -------------------------

// IMAGE file input
document
  .getElementById("post-image-upload")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    const wrapper = document.getElementById("image-preview-wrapper");
    wrapper.innerHTML = ""; // Clear previous preview if any

    if (file) {
      // Clear the other file inputs and their previews
      document.getElementById("post-audio-upload").value = "";
      document.getElementById("audio-preview-wrapper").innerHTML = "";
      document.getElementById("post-video-upload").value = "";
      document.getElementById("video-preview-wrapper").innerHTML = "";

      // Create and show the image preview
      const imageURL = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = imageURL;
      img.alt = "Image Preview";
      img.classList.add("w-full", "object-contain", "rounded");
      wrapper.appendChild(img);

      // Show refresh/clear controls for images
      showFileControls("image");
    }
  });

// AUDIO file input
document
  .getElementById("post-audio-upload")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    const wrapper = document.getElementById("audio-preview-wrapper");
    wrapper.innerHTML = "";

    if (file) {
      // Clear image and video inputs and their previews
      document.getElementById("post-image-upload").value = "";
      document.getElementById("image-preview-wrapper").innerHTML = "";
      document.getElementById("post-video-upload").value = "";
      document.getElementById("video-preview-wrapper").innerHTML = "";

      // Create and show the audio preview
      const audioURL = URL.createObjectURL(file);
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.classList.add("w-full");
      const source = document.createElement("source");
      source.src = audioURL;
      source.type = file.type;
      audio.appendChild(source);
      wrapper.appendChild(audio);

      // Show refresh/clear controls for audio
      showFileControls("audio");
    }
  });

// VIDEO file input
document
  .getElementById("post-video-upload")
  .addEventListener("change", function (e) {
    const file = e.target.files[0];
    const wrapper = document.getElementById("video-preview-wrapper");
    wrapper.innerHTML = "";

    if (file) {
      // Clear image and audio inputs and their previews
      document.getElementById("post-image-upload").value = "";
      document.getElementById("image-preview-wrapper").innerHTML = "";
      document.getElementById("post-audio-upload").value = "";
      document.getElementById("audio-preview-wrapper").innerHTML = "";

      // Create and show the video preview
      const videoURL = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.controls = true;
      video.width = 300; // adjust as needed
      video.classList.add("rounded");
      const source = document.createElement("source");
      source.src = videoURL;
      source.type = file.type;
      video.appendChild(source);
      wrapper.appendChild(video);

      // Show refresh/clear controls for video
      showFileControls("video");
    }
  });

// -------------------------
// Refresh and Clear Button Handlers
// -------------------------

// Refresh: Clears the current preview and re-opens the same file input so the user can re-upload a file of that type.
document
  .getElementById("refresh-upload")
  .addEventListener("click", function () {
    if (currentFileType === "image") {
      document.getElementById("image-preview-wrapper").innerHTML = "";
      document.getElementById("post-image-upload").value = "";
      // Trigger file selection dialog (since the user clicked refresh, which is a user gesture)
      document.getElementById("post-image-upload").click();
    } else if (currentFileType === "audio") {
      document.getElementById("audio-preview-wrapper").innerHTML = "";
      document.getElementById("post-audio-upload").value = "";
      document.getElementById("post-audio-upload").click();
    } else if (currentFileType === "video") {
      document.getElementById("video-preview-wrapper").innerHTML = "";
      document.getElementById("post-video-upload").value = "";
      document.getElementById("post-video-upload").click();
    }
  });

// Clear (Delete): Clears the current preview and resets the UI so the three file upload buttons appear again.
document.getElementById("delete-upload").addEventListener("click", function () {
  if (currentFileType === "image") {
    document.getElementById("image-preview-wrapper").innerHTML = "";
    document.getElementById("post-image-upload").value = "";
  } else if (currentFileType === "audio") {
    document.getElementById("audio-preview-wrapper").innerHTML = "";
    document.getElementById("post-audio-upload").value = "";
  } else if (currentFileType === "video") {
    document.getElementById("video-preview-wrapper").innerHTML = "";
    document.getElementById("post-video-upload").value = "";
  }
  // Reset state
  currentFileType = null;
  // Hide the refresh/clear controls
  document.getElementById("file-controls").classList.add("hidden");
  // Show all three upload buttons so the user may pick any file type
  document.getElementById("upload-image-button").classList.remove("hidden");
  document.getElementById("upload-audio-button").classList.remove("hidden");
  document.getElementById("upload-video-button").classList.remove("hidden");
});

document.getElementById("submit-post").addEventListener("click", async (e) => {
  e.preventDefault();

  // AWS parameters remain the same
  const awsParam = "e8ad43b6ddadf5883ee7ec0a98a5450d";
  const awsParamUrl = "https://library.priestesspresence.com/s/aws";

  // Get the post content from the editor
  const editor = document.getElementById("post-editor");
  const textContent = editor.innerText.trim();

  // Get file inputs (the three remain in the DOM)
  const imageInput = document.getElementById("post-image-upload");
  const audioInput = document.getElementById("post-audio-upload");
  const videoInput = document.getElementById("post-video-upload");

  // Determine which file is uploaded – only one is allowed
  const imageFile = imageInput.files[0];
  const audioFile = audioInput.files[0];
  const videoFile = videoInput.files[0];

  let uploadedFile = null;
  let fileType = null;
  if (imageFile) {
    uploadedFile = imageFile;
    fileType = "Image";
  } else if (audioFile) {
    uploadedFile = audioFile;
    fileType = "Audio";
  } else if (videoFile) {
    uploadedFile = videoFile;
    fileType = "Video";
  }

  // At least one (text or file) is required
  if (!textContent && !uploadedFile) {
    UIManager.showError("Post content or a file is required.");
    return;
  }

  // Hide the modal (your modal hide logic remains)
  document.getElementById("postNewModal").hide();

  // Extract mentioned IDs
  const mentionedIds = [];
  editor.querySelectorAll(".mention").forEach((mention) => {
    const id = mention.dataset.contactId;
    if (id) {
      mentionedIds.push(id);
    }
  });

  // Create a temporary post using the new fields:
  const tempPost = {
    id: `temp-${Date.now()}`,
    author_id: forumManager.userId,
    // NEW: Use file_content (preview URL) and file_tpe (the file type)
    file_content: uploadedFile
      ? { link: URL.createObjectURL(uploadedFile) }
      : null,
    file_tpe: uploadedFile ? fileType : null,
    author: {
      name: forumManager.fullName,
      profileImage: forumManager.defaultAuthorImage,
    },
    date: "Just now",
    content: textContent,
  };

  const template = $.templates("#post-template");
  const postContainer = document.querySelector(CONFIG.selectors.postsContainer);
  postContainer.insertAdjacentHTML("afterbegin", template.render(tempPost));
  const postElement = postContainer.firstElementChild;
  postElement.classList.add("state-disabled");

  // Process file upload (only one file field is needed)
  let fileData = null;
  const fileFields = [];
  if (uploadedFile) {
    fileFields.push({
      fieldName: "file_content", // NEW: single file field name
      file: uploadedFile,
    });
  }

  try {
    if (fileFields.length > 0) {
      const toSubmitFields = {};
      await processFileFields(
        toSubmitFields,
        fileFields,
        awsParam,
        awsParamUrl
      );
      fileData =
        typeof toSubmitFields.file_content === "string"
          ? JSON.parse(toSubmitFields.file_content)
          : toSubmitFields.file_content;
      fileData.name = fileData.name || uploadedFile.name;
      fileData.size = fileData.size || uploadedFile.size;
      fileData.type = fileData.type || uploadedFile.type;
    }

    // Send the create post mutation using the new file fields
    const response = await ApiService.query(
      `
        mutation createForumPost($payload: ForumPostCreateInput!) {
          createForumPost(payload: $payload) {
            id
            author_id
            post_copy
            file_tpe
            file_content
            Mentioned_Users {
              id
            }
          }
        }
        `,
      {
        payload: {
          author_id: forumManager.userId,
          post_copy: textContent,
          Mentioned_Users: mentionedIds.map((id) => ({ id: Number(id) })),
          // NEW: send the file type and file data regardless of which button was used
          file_tpe: uploadedFile ? fileType : null,
          file_content: fileData ? fileData : null,
        },
      }
    );

    const newPost = response.createForumPost;
    postElement.dataset.postId = newPost.id;

    // (Optional) Fetch additional details as before…
    const fetchResponse = await ApiService.query(
      `
        query calcForumPosts($id: PriestessForumPostID) {
          calcForumPosts(query: [{ where: { id: $id } }]) {
            ID: field(arg: ["id"])
            Author_ID: field(arg: ["author_id"])
            Author_First_Name: field(arg: ["Author", "first_name"])
            Author_Last_Name: field(arg: ["Author", "last_name"])
            Author_Profile_Image: field(arg: ["Author", "profile_image"])
            Date_Added: field(arg: ["created_at"])
            Post_Copy: field(arg: ["post_copy"])
            File_Tpe: field(arg: ["file_tpe"])
            File_Content: field(arg: ["file_content"])
            ForumCommentsTotalCount: countDistinct(args: [{ field: ["ForumComments", "id"] }])
            Member_Post_Upvotes_DataTotal_Count: countDistinct(args: [{ field: ["Member_Post_Upvotes_Data", "id"] }])
          }
        }
        `,
      { id: newPost.id }
    );

    const actualPost = fetchResponse.calcForumPosts[0];

    // Update DOM elements (update any file-related UI as needed)
    postElement.querySelector(".vote-button").dataset.postId = actualPost.ID;
    postElement.querySelector(".editPostModal").dataset.postId = actualPost.ID;
    postElement.querySelector(".post-author-name").textContent =
      actualPost.Author_First_Name + " " + actualPost.Author_Last_Name;
    postElement.querySelector(".post-author-image").src =
      actualPost.Author_Profile_Image;
    postElement.querySelector(".post-copy-content").textContent =
      actualPost.Post_Copy;
    postElement.querySelector(".postCommentCount").textContent =
      actualPost.ForumCommentsTotalCount;
    postElement.querySelector(".postVoteCount").textContent =
      actualPost.Member_Post_Upvotes_DataTotal_Count;
    postElement.querySelector(".delete-post-btn").dataset.postId =
      actualPost.ID;
    postElement.dataset.postId = actualPost.ID;
    postElement.querySelector(".audio-player").id = "audio-" + actualPost.ID;
    const playPauseButton = postElement.querySelector("#play-pause");
    if (playPauseButton) {
      playPauseButton.dataset.audioButton = actualPost.ID; // Update with actual ID
    }
    const audioPlayer = postElement.querySelector(".audio-player");
    audioPlayer.dataset.audioPlayer = actualPost.ID;
  } catch (error) {
    console.error("Error during post creation:", error);
    UIManager.showError("Failed to post. Please try again.");
    postContainer.removeChild(postElement);
  } finally {
    // Clear the editor and remove the temporary disabled state
    editor.innerHTML = "";
    postElement.classList.remove("state-disabled");
    // (Optional) Clear the file inputs here if desired.
  }
});

document.addEventListener("click", async (e) => {
  const replyButton = e.target.closest(".submit-reply");
  if (replyButton) {
    const commentId = replyButton.dataset.commentId;
    const replyForm = replyButton.closest(".reply-form");
    replyForm.classList.add("state-disabled");
    if (!replyForm) {
      return;
    }
    const editor = replyForm.querySelector(".reply-editor");
    // Clear the reply editor after submission.
    if (!editor) {
      return;
    }
    const content = editor.innerText.trim();
    if (!content) {
      UIManager.showError("Reply cannot be empty");
      return;
    }
    const mentionedIds = [];
    const mentionElements = editor.querySelectorAll(".mention");
    mentionElements.forEach((mention) => {
      const id = mention.dataset.contactId;
      if (id) mentionedIds.push(id);
    });
    await forumManager.createReply(commentId, content, mentionedIds);
    editor.innerHTML = "";
    replyForm.classList.remove("state-disabled");
  }
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".edit-post")) {
    const postElement = event.target.closest("[data-postid]");
    const postId = postElement.dataset.postid;
    const editor = postElement.querySelector(".post-editor");
    const content = editor.innerText.trim();
    forumManager.editPost(postId, content);
    postElement.hide();
  }
});
