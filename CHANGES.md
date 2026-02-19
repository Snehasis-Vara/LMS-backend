# Changes Made - February 19, 2026

## Summary
Fixed role-based access control and added book count display for duplicate titles.

## Backend Changes

### 1. Transaction Controller (`backend/src/transactions/transactions.controller.ts`)
- **Added**: `@Req()` decorator import from `@nestjs/common`
- **Modified**: `findAll(@Req() req)` - Passes authenticated user to service
- **Modified**: `findActiveByUser(@Param('userId') userId, @Req() req)` - Added user context
- **Modified**: `findOne(@Param('id') id, @Req() req)` - Added user context
- **Added**: `@Roles(Role.ADMIN, Role.LIBRARIAN)` guard on `findOverdue()` endpoint
- **Purpose**: Enable role-based filtering and authorization at the backend level

### 2. Transaction Service (`backend/src/transactions/transactions.service.ts`)
- **Added**: `ForbiddenException` import
- **Modified**: `findAll(user)` - Role-based filtering:
  - **STUDENT**: Only sees their own transactions (`where: { userId: user.id }`)
  - **ADMIN/LIBRARIAN**: Sees all transactions (`where: {}`)
  - Orders by `issueDate` descending
- **Modified**: `findActiveByUser(userId, user)` - Authorization check:
  - Students can only query their own userId
  - Throws `ForbiddenException` if student tries to access other user's data
- **Modified**: `findOne(id, user)` - Authorization check:
  - Students can only view their own transactions
  - Throws `ForbiddenException` if student tries to access other user's transaction
- **Purpose**: Enforce data privacy at database query level - no bypass possible

## Frontend Changes

### 3. Transactions Page (`frontend/app/transactions/page.tsx`)
- **Removed**: Client-side filtering logic (now handled by backend)
- **Simplified**: `fetchData()` function - backend now returns filtered data
- **Purpose**: Cleaner code and better security (filtering at source)

### 4. Books Page (`frontend/app/books/page.tsx`)
- **Added**: Book grouping logic to count copies per title
- **Added**: Visual badge showing copy count for each book
- **Implementation**:
  ```typescript
  // Groups books by title (case-insensitive)
  const bookGroups = filteredBooks.reduce((acc, book) => {
    const key = book.title.toLowerCase();
    if (!acc[key]) {
      acc[key] = { book, count: 0 };
    }
    acc[key].count += book.copies?.length || 0;
    return acc;
  }, {} as Record<string, { book: Book; count: number }>);
  ```
- **UI**: Badge displays "X copies" or "X copy" in top-right corner of each book card
- **Purpose**: Show inventory availability at a glance

### 5. Dashboard Page (`frontend/app/dashboard/page.tsx`)
- **Modified**: Book count now shows unique titles instead of total book records
- **Implementation**: Uses `Set` to count unique titles (case-insensitive)
- **Purpose**: Accurate book count regardless of duplicate entries

## Security Improvements

1. **Backend Enforcement**: Students can only access their own transactions via API
2. **No Client-Side Bypass**: Filtering happens at database query level
3. **Role-Based Queries**: Different SQL queries based on user role
4. **Authorization Checks**: All transaction endpoints validate user ownership
5. **Protected Endpoints**:
   - `GET /api/transactions` - Filtered by role (students see only their own)
   - `GET /api/transactions/:id` - Students can only view their own transaction
   - `GET /api/transactions/active/:userId` - Students can only query their own userId
   - `GET /api/transactions/overdue` - Admin/Librarian only
6. **JWT Extraction**: User context extracted from JWT token via Passport strategy
7. **No Query Param Bypass**: Even if students try to pass different userIds, backend validates against JWT

### How It Works:
```typescript
// JWT Strategy extracts user from token
validate(payload: any) {
  return { id: user.id, email: user.email, role: user.role };
}

// Service filters based on role
async findAll(user: any) {
  const where = user.role === 'STUDENT' ? { userId: user.id } : {};
  return this.prisma.transaction.findMany({ where, ... });
}

// Authorization check prevents cross-user access
if (user.role === 'STUDENT' && transaction.userId !== user.id) {
  throw new ForbiddenException('You can only view your own transactions');
}
```

## User Experience Improvements

1. **Book Count Badge**: Users can see how many copies are available
2. **Accurate Dashboard Stats**: Shows unique book titles
3. **Proper Transaction Filtering**: Students see only relevant data
4. **Admin View**: Admins still see all transactions and users

## Testing Checklist

- [x] Backend builds successfully
- [x] Frontend builds successfully
- [x] All services start without errors
- [ ] **Test Case 1**: Login as STUDENT - verify only own transactions visible in dashboard
- [ ] **Test Case 2**: Login as STUDENT - try to access `/api/transactions` - should see only own records
- [ ] **Test Case 3**: Login as STUDENT - try to access another user's transaction by ID - should get 403 Forbidden
- [ ] **Test Case 4**: Login as ADMIN - verify all transactions visible
- [ ] **Test Case 5**: Check books page shows copy count badge
- [ ] **Test Case 6**: Verify dashboard shows correct unique book count
- [ ] **Test Case 7**: Try to manipulate userId in query params as STUDENT - should be blocked

### Expected Results:
- **User A (STUDENT)**: Issued 2 books → Dashboard shows 2 transactions
- **User B (STUDENT)**: Issued 1 book → Dashboard shows 1 transaction  
- **Admin**: Dashboard shows all 3 transactions

## Access Points

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs

## Default Credentials

- **Email**: admin@lms.com
- **Password**: admin123
- **Role**: ADMIN

## Commands

```bash
# Start application
./start.sh

# Or manually
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down
```

## Files Modified

1. `backend/src/transactions/transactions.controller.ts`
2. `backend/src/transactions/transactions.service.ts`
3. `frontend/app/transactions/page.tsx`
4. `frontend/app/books/page.tsx`
5. `frontend/app/dashboard/page.tsx`
