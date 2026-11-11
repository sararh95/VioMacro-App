import { randomUUID } from 'node:crypto';
import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  connectAuthEmulator,
  signOut,
} from 'firebase/auth';
import {
  connectStorageEmulator,
  deleteObject,
  getBytes,
  getStorage,
  ref,
  uploadString,
} from 'firebase/storage';

const apps = [];

function createClient(label) {
  const app = initializeApp(
    {
      apiKey: 'demo-key',
      authDomain: 'localhost',
      projectId: 'viomacro-storage-rules',
      storageBucket: 'viomacro-storage-rules.appspot.com',
    },
    `${label}-${randomUUID()}`
  );
  apps.push(app);

  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });

  const storage = getStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);

  return { auth, storage };
}

async function signInNewUser(label) {
  const client = createClient(label);
  const email = `${label}-${randomUUID()}@example.com`;
  const credential = await createUserWithEmailAndPassword(client.auth, email, 'Test1234!');
  return { ...client, uid: credential.user.uid };
}

after(async () => {
  await Promise.allSettled(apps.map((app) => deleteApp(app)));
});

beforeEach(async () => {
  await Promise.allSettled(
    apps.map((app) => {
      const auth = getAuth(app);
      return auth.currentUser ? signOut(auth) : Promise.resolve();
    })
  );
});

describe('Storage rules: recipe assets', () => {
  test('allows an owner to upload, read, and delete a valid recipe image', async () => {
    const owner = await signInNewUser('owner');
    const imageRef = ref(owner.storage, `users/${owner.uid}/recipes/${randomUUID()}.png`);

    await uploadString(imageRef, 'hello-image', 'raw', { contentType: 'image/png' });
    const bytes = await getBytes(imageRef);
    assert.equal(Buffer.from(bytes).toString('utf8'), 'hello-image');
    await deleteObject(imageRef);
  });

  test('denies cross-user reads and writes', async () => {
    const owner = await signInNewUser('owner');
    const other = await signInNewUser('other');
    const assetPath = `users/${owner.uid}/recipes/${randomUUID()}.png`;

    await uploadString(ref(owner.storage, assetPath), 'owner-image', 'raw', {
      contentType: 'image/png',
    });

    await assert.rejects(() => getBytes(ref(other.storage, assetPath)));
    await assert.rejects(() =>
      uploadString(ref(other.storage, assetPath), 'other-image', 'raw', {
        contentType: 'image/png',
      })
    );
    await assert.rejects(() => deleteObject(ref(other.storage, assetPath)));
  });

  test('denies unauthenticated access and invalid file types', async () => {
    const owner = await signInNewUser('owner');
    const anon = createClient('anon');
    const assetPath = `users/${owner.uid}/recipes/${randomUUID()}.png`;

    await assert.rejects(() =>
      uploadString(ref(anon.storage, assetPath), 'anon-image', 'raw', {
        contentType: 'image/png',
      })
    );
    await assert.rejects(() =>
      uploadString(ref(owner.storage, `users/${owner.uid}/recipes/${randomUUID()}.txt`), 'nope', 'raw', {
        contentType: 'text/plain',
      })
    );
  });
});
