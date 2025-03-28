Content Hierarchy 
1. Post - > Comment - > Replies 
      
Components  

1.  Navbar 
2.  Menus
3.  Buttons - Solid/Outline/Plain/Icon Button : Type submit and button
4.  Rich text editor
5.  Audio player 
6.  Video player

Layouts

1. Flex Card

Pages

1. Post Page - A single page to filter through all the posts
2. All notifications page / Settings - A single page to view all notifications and set preferences

Popups - Custom Code - > Body (Alpine Js)

1.  Create post
2.  Edit post/comment/reply
3.  Open video popup
4.  Notification popup

External Libraries

1. Alpine JS to open modals and templating modals if conditioning required
2. JS Render to template every dynamic content fetched from graphql api
3. Tailwind for styling
4. Plyr for interactive videos/audios/images section
5. DXHTMLEDITOR for text input in creating post, comments and replies to support interactive mentioning system
6. jQuery in place for vanilla js

Queries required from graphql

Fetch

1. Fetch recent posts
2. Fetch featured posts
3. Fetch saved posts
4. Fetch my posts
5. Fetch votes for posts
6. Fetch comments for posts
7. Fetch votes for comments
8. Fetch replies for comments
9. Fetch votes for replies
10. Fetch contacts for mentioning or tagging
11. Fetch notifications based on conditions users have set

Create

1. Create post
2. Create vote for post
3. Create comment for post
4. Create vote for comment
5. Create reply for comment
6. Create vote for reply
7. Create bookmark record
8. Create read record for notification

Edit/Update

1. Edit post
2. Edit comment
3. Edit reply

Delete

1. Delete post
2. Delete comment
3. Delete reply
4. Delete vote for post
5. Delete vote for comment
6. Delete vote for reply
7. Delete bookmark record
8. Delete mentions of posts
9. Delete mentions of comments
10. Delete mentions of replies

