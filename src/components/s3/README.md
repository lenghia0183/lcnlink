# S3 Module

Module này cung cấp các chức năng để upload và quản lý file trên AWS S3.

## Cấu hình

Thêm các biến môi trường sau vào file `.env`:

```env
# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## Các API endpoints

### 1. Upload một file

```
POST /api/v1/s3/upload
```

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `file`: File cần upload (required)
- `folder`: Thư mục để lưu file (optional)
- `customFileName`: Tên file tùy chỉnh (optional)

**Response:**
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "fileName": "abc123.jpg",
    "originalName": "my-photo.jpg",
    "fileUrl": "https://my-bucket.s3.amazonaws.com/avatars/abc123.jpg",
    "key": "avatars/abc123.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg"
  }
}
```

### 2. Upload nhiều file

```
POST /api/v1/s3/upload-multiple
```

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `files`: Danh sách file cần upload (required, tối đa 10 files)
- `folder`: Thư mục để lưu file (optional)

### 3. Xóa một file

```
DELETE /api/v1/s3/delete
```

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "key": "avatars/abc123.jpg"
}
```

### 4. Xóa nhiều file

```
DELETE /api/v1/s3/delete-multiple
```

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "keys": ["avatars/abc123.jpg", "documents/def456.pdf"]
}
```

### 5. Tạo presigned URL

```
GET /api/v1/s3/presigned-url?key=avatars/abc123.jpg&expiresIn=3600
```

**Headers:**
- `Authorization: Bearer <token>`

**Query Parameters:**
- `key`: Key của file trong S3 (required)
- `expiresIn`: Thời gian hết hạn tính bằng giây (optional, mặc định 3600)

## Sử dụng S3Service trong code

```typescript
import { S3Service } from '@components/s3/s3.service';

@Injectable()
export class YourService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadUserAvatar(file: Express.Multer.File, userId: string) {
    return this.s3Service.uploadFile(file, 'avatars', `user-${userId}`);
  }

  async deleteUserAvatar(key: string) {
    return this.s3Service.deleteFile(key);
  }

  async getFileUrl(key: string): string {
    return this.s3Service.getFileUrl(key);
  }
}
```

## Phân quyền

Tất cả các endpoint đều yêu cầu authentication và có thể được sử dụng bởi:
- USER_ROLE_ENUM.USER
- USER_ROLE_ENUM.ADMIN

## Lưu ý

1. File upload có giới hạn kích thước tùy thuộc vào cấu hình của NestJS
2. Upload multiple files giới hạn tối đa 10 files một lần
3. Presigned URL có thời gian hết hạn tối đa 7 ngày (604800 giây)
4. Tất cả file được upload sẽ có public read access
5. File name sẽ được tự động tạo UUID nếu không cung cấp customFileName
