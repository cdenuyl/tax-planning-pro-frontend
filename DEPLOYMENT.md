# Deployment Guide

## 🚀 **Deployment Options**

### **Option 1: Static Hosting Services**

#### **Netlify (Recommended)**
1. Build the application:
   ```bash
   npm run build
   ```
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop the `dist/` folder to deploy
4. Your app will be live instantly with a custom URL

#### **Vercel**
1. Build the application:
   ```bash
   npm run build
   ```
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Deploy:
   ```bash
   vercel --prod
   ```

#### **GitHub Pages**
1. Push your code to GitHub repository
2. Build the application:
   ```bash
   npm run build
   ```
3. Deploy to gh-pages:
   ```bash
   npm install -g gh-pages
   gh-pages -d dist
   ```

---

### **Option 2: Traditional Web Hosting**

#### **cPanel/Shared Hosting**
1. Build the application:
   ```bash
   npm run build
   ```
2. Upload contents of `dist/` folder to your web hosting
3. Ensure files are in the public_html directory
4. Access via your domain

#### **Apache/Nginx Server**
1. Build the application:
   ```bash
   npm run build
   ```
2. Copy `dist/` contents to web server directory
3. Configure server to serve static files
4. Set up proper MIME types for .js and .css files

---

### **Option 3: CDN Deployment**

#### **AWS S3 + CloudFront**
1. Build the application:
   ```bash
   npm run build
   ```
2. Create S3 bucket for static website hosting
3. Upload `dist/` contents to S3
4. Configure CloudFront distribution
5. Set up custom domain if needed

#### **Google Cloud Storage**
1. Build the application:
   ```bash
   npm run build
   ```
2. Create Google Cloud Storage bucket
3. Upload `dist/` contents
4. Enable static website hosting
5. Configure load balancer if needed

---

## ⚙️ **Build Configuration**

### **Production Build**
```bash
# Standard production build
npm run build

# Build with custom base path
npm run build -- --base=/tax-calculator/

# Build with environment variables
NODE_ENV=production npm run build
```

### **Build Output**
The build creates a `dist/` folder containing:
```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── index-[hash].js     # JavaScript bundle
│   ├── index-[hash].css    # CSS bundle
│   └── tax-on-a-me-logo.png # Logo image
```

### **Build Optimization**
- **Code Splitting:** Automatic chunk splitting for better loading
- **Minification:** JavaScript and CSS are minified
- **Asset Optimization:** Images and fonts are optimized
- **Cache Busting:** File hashes for proper caching

---

## 🔧 **Server Configuration**

### **Apache (.htaccess)**
Create `.htaccess` in your web root:
```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
</IfModule>

# Handle client-side routing (if needed in future)
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

### **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle client-side routing (if needed in future)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 🌐 **Custom Domain Setup**

### **DNS Configuration**
1. Point your domain to hosting provider
2. Set up A record or CNAME as required
3. Configure SSL certificate
4. Test domain resolution

### **SSL/HTTPS Setup**
Most modern hosting providers offer free SSL:
- **Netlify:** Automatic SSL with Let's Encrypt
- **Vercel:** Automatic SSL included
- **Cloudflare:** Free SSL proxy available

---

## 📊 **Performance Optimization**

### **Bundle Analysis**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist/assets/*.js
```

### **Performance Tips**
1. **Enable Compression:** Gzip/Brotli on server
2. **Use CDN:** Serve static assets from CDN
3. **Cache Headers:** Set appropriate cache headers
4. **Image Optimization:** Optimize images before deployment
5. **Lazy Loading:** Consider lazy loading for future features

### **Monitoring**
- **Google PageSpeed Insights:** Test performance
- **GTmetrix:** Analyze loading times
- **Lighthouse:** Audit performance, accessibility, SEO

---

## 🔒 **Security Considerations**

### **Content Security Policy (CSP)**
Add to your HTML or server headers:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;">
```

### **Security Headers**
Configure server to send security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 🧪 **Testing Deployment**

### **Pre-deployment Checklist**
- [ ] Application builds without errors
- [ ] All features work in production build
- [ ] Mobile responsiveness tested
- [ ] Performance is acceptable
- [ ] No console errors in browser

### **Post-deployment Testing**
1. **Functionality Test:** Test all features work
2. **Performance Test:** Check loading times
3. **Mobile Test:** Verify mobile experience
4. **Browser Test:** Test in different browsers
5. **SEO Test:** Check meta tags and structure

### **Automated Testing**
```bash
# Run tests before deployment
npm test

# Build and test production bundle
npm run build
npm run preview
```

---

## 🚨 **Troubleshooting**

### **Common Deployment Issues**

#### **Blank Page After Deployment**
- Check browser console for JavaScript errors
- Verify all assets are loading correctly
- Check server MIME types for .js and .css files

#### **Assets Not Loading**
- Verify file paths are correct
- Check server configuration for static files
- Ensure proper MIME types are set

#### **Performance Issues**
- Enable compression on server
- Optimize images
- Use CDN for static assets
- Check for large JavaScript bundles

### **Debug Commands**
```bash
# Test production build locally
npm run build
npm run preview

# Check bundle size
npm run build
ls -la dist/assets/

# Verify all files are included
find dist -type f -name "*.js" -o -name "*.css" -o -name "*.html"
```

---

## 📞 **Support**

### **Deployment Support**
- Check hosting provider documentation
- Verify Node.js version compatibility
- Ensure build process completes successfully
- Test locally before deploying

### **Performance Issues**
- Use browser dev tools to identify bottlenecks
- Check network tab for slow-loading resources
- Verify server compression is enabled
- Consider using a CDN for better global performance

---

**Deployment Date:** June 18, 2025  
**Status:** ✅ PRODUCTION READY  
**Live Demo:** https://qmnyuyjf.manus.space

