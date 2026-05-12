
async function testDelete() {
    const baseUrl = 'http://localhost:5000/api/posts';
    
    try {
        console.log('1. Creating a test post...');
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authorId: 'test-user-123',
                title: 'Delete Test',
                content: 'This post should be deleted'
            })
        });
        
        if (!createRes.ok) throw new Error('Failed to create post');
        const post = await createRes.json();
        const postId = post.id || post._id;
        console.log('   Post created with ID:', postId);
        
        console.log('\n2. Verifying post exists in feed...');
        const getRes = await fetch(baseUrl);
        const posts = await getRes.json();
        const foundBefore = posts.find(p => (p.id || p._id) === postId);
        console.log('   Found in feed?', !!foundBefore);
        
        console.log('\n3. Deleting the post...');
        const deleteRes = await fetch(`${baseUrl}/${postId}`, {
            method: 'DELETE'
        });
        
        console.log('   Delete response status:', deleteRes.status);
        if (deleteRes.status === 204 || deleteRes.ok) {
            console.log('   Delete successful (Status 204/OK)');
        } else {
            console.log('   Delete failed');
        }
        
        console.log('\n4. Verifying post is gone...');
        const getResAfter = await fetch(baseUrl);
        const postsAfter = await getResAfter.json();
        const foundAfter = postsAfter.find(p => (p.id || p._id) === postId);
        console.log('   Still in feed?', !!foundAfter);
        
        if (!foundAfter) {
            console.log('\nSUCCESS: Delete post is working correctly on the backend!');
        } else {
            console.log('\nFAILURE: Post still exists after deletion.');
        }
        
    } catch (err) {
        console.error('Test error:', err.message);
        console.log('Is the server running on http://localhost:5000?');
    }
}

testDelete();
