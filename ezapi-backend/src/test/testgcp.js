// **********copyright info*****************************************
// This code is copyright of EZAPI LLC. For further info, reach out to rams@ezapi.ai
// *****************************************************************

// Imports the Google Cloud client library.
const { Storage } = require('@google-cloud/storage');

// Instantiates a client. Explicitly use service account credentials by
// specifying the private key file. All clients in google-cloud-node have this
// helper, see https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// const projectId = 'project-id'
// const keyFilename = '/path/to/keyfile.json'
const projectId = "civic-access-286104"
const keyFilename = "creds.json"

const storage = new Storage({ projectId, keyFilename });

//const storage = new Storage();


// Makes an authenticated API request.
async function listBuckets() {
    try {
        const [buckets] = await storage.getBuckets();

        console.log('Buckets:');
        buckets.forEach((bucket) => {
            console.log(bucket.name);
        });
    } catch (err) {
        console.error('ERROR:', err);
    }
}
listBuckets();

/*
async function getBucketMetadata() {
    // Get bucket metadata.
    // const bucketName = 'Name of a bucket, e.g. my-bucket';

    // Get Bucket Metadata
    const [metadata] = await storage.bucket('ezpai-poc').getMetadata();

    for (const [key, value] of Object.entries(metadata)) {
        console.log(`${key}: ${value}`);
    }
}
getBucketMetadata()
*/



/*
const bucketName = 'ezpai-poc'
const filepath = './medium.png'
const filename = 'ezapi-logo.png'

async function uploadFile() {
    // Uploads a local file to the bucket
    await storage.bucket(bucketName).upload(filepath, {
        // Support for HTTP requests made with `Accept-Encoding: gzip`
        destination: `test/${filename}`,
        gzip: true,
        // By setting the option `destination`, you can change the name of the
        // object you are uploading to a bucket.
        metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
        },
    });

    console.log(`${filename} uploaded to ${bucketName}.`);
}

uploadFile().catch(console.error);
*/




console.log("listing files")
const bucketName = 'ezpai-poc'

async function listFiles() {
    // Lists files in the bucket
    const [files] = await storage.bucket(bucketName).getFiles();

    console.log('Files:');
    files.forEach(file => {
        console.log(file.name);
    });
}

listFiles().catch(console.error);


// const bucketName = 'ezpai-poc'
// const srcFilename = 'test'
// const destFilename = 'dwl.zip'

// async function downloadFile() {
//     const options = {
//         // The path to which the file should be downloaded, e.g. "./file.txt"
//         destination: destFilename,
//     };

//     // Downloads the file
//     await storage.bucket(bucketName).file(srcFilename).download(options);

//     console.log(
//         `gs://${bucketName}/${srcFilename} downloaded to ${destFilename}.`
//     );
// }

// downloadFile().catch(console.error);

/*
async function generateV4ReadSignedUrl() {
    // These options will allow temporary read access to the file
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    // Get a v4 signed URL for reading the file
    const [url] = await storage
        .bucket('ezpai-poc')
        .file('uber__user__1601562638248/apiops_dump')
        .getSignedUrl(options);

    console.log('Generated GET signed URL:');
    console.log(url);
    console.log('You can use this URL with any user agent, for example:');
    console.log(`curl '${url}'`);
}

generateV4ReadSignedUrl().catch(console.error);
*/