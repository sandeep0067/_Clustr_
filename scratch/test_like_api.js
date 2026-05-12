
async function testLike() {
    const baseUrl = 'http://localhost:5000/api/posts';
    
    try {
        console.log('1. Creating a test post...');
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authorId: 'user-1',
                content: 'Like test post'
            })
        });
        const post = await createRes.json();
        const postId = post.id || post._id;
        console.log('   Post created with ID:', postId);
        
        console.log('\n2. Liking the post...');
        const userId = 'user-likes-this';
        const reactions = [{ userId, type: 'like' }];
        const likes = [userId];
        
        const likeRes = await fetch(`${baseUrl}/${postId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reactions, likes })
        });
        
        if (!likeRes.ok) throw new Error(`Like failed with status ${likeRes.status}`);
        const updatedPost = await likeRes.json();
        
        console.log('   Updated post likes:', updatedPost.likes);
        console.log('   Updated post reactions:', updatedPost.reactions);
        
        if (updatedPost.likes?.includes(userId)) {
            console.log('\nSUCCESS: Like API is working correctly!');
        } else {
            console.log('\nFAILURE: Like was not saved.');
        }
    } catch (err) {
        console.error('Test error:', err.message);
    }
}

testLike();
