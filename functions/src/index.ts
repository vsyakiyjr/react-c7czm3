const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const sharp = require('sharp');
const _ = require('lodash');
const path = require('path');
const os = require('os');
import * as admin from 'firebase-admin';
import MessagingPayload = admin.messaging.MessagingPayload;
import {DocumentReference} from '@firebase/firestore-types';

admin.initializeApp({
    credential: admin.credential.cert(require('../Honor-2564b5abf29c.json')),
});

exports.generateThumbnail = functions.storage.object('attachments/{imageId}').onFinalize(object => {
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
    const SIZES = [64, 256, 512]; // Resize target width in pixels

    if (resourceState === 'not_exists') {
        console.log('This is not an image.');
        return;
    }

    if (_.includes(filePath, '_thumb')) {
        console.log('already processed image');
        return;
    }

    const fileName = filePath.split('/').pop();
    const bucket = gcs.bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);

    return bucket.file(filePath).download({
        destination: tempFilePath
    }).then(() => {
        _.each(SIZES, (size) => {

            const newFileName = `${fileName}_${size}_thumb.png`
            const newFileTemp = path.join(os.tmpdir(), newFileName);
            const newFilePath = `thumbs/${newFileName}`;

            sharp(tempFilePath)
                .resize(size, null)
                .toFile(newFileTemp, (err, info) => {

                    bucket.upload(newFileTemp, {
                        destination: newFilePath
                    });

                });
        })
    })
});

exports.onCommentsChange = functions.firestore.document('requests/{requestId}/comments/{commentId}').onUpdate(async (change, context) => {
    const newValue = change.after.data();
    const previousValue = change.before.data();

    //comment set right
    if (!previousValue.right && newValue.right) {
        await actWithRating(newValue.user);
        // await setNotificationToUser(newValue.user, {
        //     notification: {
        //         title: 'Ваш отклик выбран правильным!'
        //     }
        // });
        //
        // await newValue.user.collection('notifications').add({
        //     title: 'Ваш отклик выбран правильным!',
        //     user:
        // });


        return admin.firestore().doc('requests/'+context.params.requestId).collection('comments').get().then((querySnapshot: any) => {
            const documents = [];

            querySnapshot.forEach(document => {
                if (document.id !== context.params.commentId) {
                    documents.push(document);
                }
            });

            return Promise.all(documents.map(async doc => doc.ref.set({right: false}, {merge: true})));
        }).catch(e => console.log(e));
    }

    return 'ok';
});

exports.onNewComments = functions.firestore.document('requests/{requestId}/comments/{commentId}').onCreate((snapshot, context) => {
    return admin.firestore().doc('requests/'+context.params.requestId).get().then(async (requestDoc: any) => {
        const comment = snapshot.data();
        const authorSnap = await comment.user.get();
        const author = {...authorSnap.data()};
        const request = requestDoc.data();

        const payload = {
            notification: {
                title: 'Новый комментарий!',
                body: `${capitalize(author.firstname)} ${capitalize(author.lastname)} прокомментировал ${reqHelper(request)} "${request.title}"`
            }
        };

        if (request.type === 'request') {
            payload.notification.title = 'Новый отклик';
        }

        await request.user.collection('notifications').add({
            user: comment.user,
            title: payload.notification.body,
            createdAt: +Date.now(),
            meta: {
                type: 'new_comment',
                request: requestDoc.ref,
                comment: snapshot.ref
            }
        });

        await actWithRating(request.user);
        return setNotificationToUser(request.user, payload);
    });
});

exports.onRequestLike = functions.firestore.document('requests/{requestId}/comments/{commentId}/likes/{likeId}').onCreate((snapshot, context) => {
    const like = snapshot.data();
    return admin.firestore().doc('requests/' + context.params.requestId + '/comments/' + context.params.commentId).get().then(async commentSnap => {
        const comment = commentSnap.data();
        const authorSnap = await like.user.get();
        const author = {...authorSnap.data()};

        const payload = {
            notification: {
                title: 'Новый лайк!',
                body: `${capitalize(author.firstname)} ${capitalize(author.lastname)} лайкнул Ваш комментарий "${comment.text}"`
            }
        };

        await comment.user.collection('notifications').add({
            user: like.user,
            title: payload.notification.body,
            createdAt: +Date.now(),
            meta: {
                type: 'new_comment_like',
                request: admin.firestore().doc('requests/' + context.params.requestId),
                comment: comment.ref
            }
        });

        await actWithRating(comment.user);
        return setNotificationToUser(comment.user, payload);
    });
});

exports.onCommentLike = functions.firestore.document('requests/{requestId}/likes/{likeId}').onCreate((snapshot, context) => {
    return admin.firestore().doc('requests/' + context.params.requestId).get().then(async (requestDoc: any) => {
        const request = requestDoc.data();
        const like = snapshot.data();
        const authorSnap = await like.user.get();
        const author = {...authorSnap.data()};

        const payload = {
            notification: {
                title: 'Новый лайк!',
                body: `${capitalize(author.firstname)} ${capitalize(author.lastname)} лайкнул ${reqHelper(request)} "${request.title}"`
            }
        };

        await request.user.collection('notifications').add({
            user: like.user,
            title: payload.notification.body,
            createdAt: +Date.now(),
            meta: {
                type: 'new_request_like',
                request: requestDoc.ref
            }
        });

        await actWithRating(request.user);
        return setNotificationToUser(request.user, payload);
    });
});

exports.onRequestCreate = functions.firestore.document('requests/{requestId}').onCreate((snapshot, context) => {
    //todo add notification about new requests
    return actWithRating(snapshot.data().user);
});

async function setNotificationToUser(userRef: DocumentReference, payload: MessagingPayload): Promise<any> {
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        const pushTokens = userDoc.data();

        if (pushTokens) {
            payload.notification.sound = 'default';

            for (let deviceId in pushTokens) {
                if (pushTokens.hasOwnProperty(deviceId)) {
                    await admin.messaging().sendToDevice(pushTokens[deviceId], payload);
                }
            }
        }

        return 'No pushToken';
    }

    return 'ok';
}

function capitalize(string = '') {
    const trimmed = string.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function reqHelper(request): string {
    if (request.type === 'request') {
        return 'Ваш запрос';
    }

    if (request.type === 'news') {
        return 'Вашу новость';
    }

    if (request.type === 'lot') {
        return 'Ваше предложение';
    }

    return '';
}

async function actWithRating(userRef: DocumentReference) {
    //полезные отклики
    const userSnap = await userRef.get();
    const user = userSnap.data();

    const allResponds = await userRef.collection('responds').get();
    let rightRespondsCount = 0;

    const responds = [];
    allResponds.forEach((item: any) => responds.push(item));

    await Promise.all(responds.map(async item => {
        const resp = item.data();
        const respDoc = await resp.respond.get();
        const respData = respDoc.data();

        if (respData && respData.right) {
            rightRespondsCount = rightRespondsCount + 1;
        }
    }));

    //лайки на отклики
    const likesSnap = await admin.firestore().collection('requests/comments/likes').where('user', '==', userRef).get();
    const likesCount = likesSnap.size;

    //собственные запросы
    const requestsSnap = await admin.firestore().collection('requests')
                            .where('type', '==', 'request')
                            .where('user', '==', userRef)
                            .get();
    const requestsCount = requestsSnap.size;
    let requestsLikesCount = 0;

    requestsSnap.forEach((doc) => {
        const requests = doc.data();
        if (requests.likes) {
            const likeSnap = requests.likes.get();
            requestsLikesCount = requestsLikesCount + likeSnap.size;
        }
    });

    //собственные новости
    const newsSnap = await admin.firestore().collection('requests')
        .where('type', '==', 'news')
        .where('user', '==', userRef)
        .get();
    const newsCount = newsSnap.size;
    let newsLikesCount = 0;

    newsSnap.forEach((doc) => {
        const news = doc.data();
        if (news.likes) {
            const likeSnap = news.likes.get();
            newsLikesCount = newsLikesCount + likeSnap.size;
        }
    });

    //собственные лоты
    const lotsSnap = await admin.firestore().collection('requests')
        .where('type', '==', 'lot')
        .where('user', '==', userRef)
        .get();
    const lotsCount = lotsSnap.size;

    //собственные партнерства
    const partSnap = await admin.firestore().collection('requests')
        .where('type', '==', 'partnership')
        .where('user', '==', userRef)
        .get();
    const partsCount = partSnap.size;
    let partLikesCount = 0;

    partSnap.forEach((doc) => {
        const part = doc.data();
        if (part.likes) {
            const likeSnap = part.likes.get();
            partLikesCount = partLikesCount + likeSnap.size;
        }
    });

    const rating = (5 * rightRespondsCount + likesCount / 10 + (requestsCount * (1 + requestsLikesCount) / 100) + (newsCount * (1 + newsLikesCount) / 1000) + (lotsCount / 1000) + (partsCount * (1 + partLikesCount) / 500)) / (10 + 10 * 0 ) / (1 + 0.1 * 0);
    const diff = rating - user.rating;

    await userRef.set({
        rating
    }, {merge: true});

    if (diff > 0.01) {
        await userRef.collection('rating').add({
            value: diff,
            createdAt: +Date.now()
        });
    }
}