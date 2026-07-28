# Contributing to Senthil Enterprises ERP

First off, thank you for considering contributing to the ERP! This system is critical to the daily operation of physical hardware retail stores.

## 1. Development Workflow
1. **Fork & Clone**: Fork the repository and clone it locally.
2. **Branching Strategy**: 
   - `main` is always production-ready.
   - Create feature branches named: `feature/short-description` or `bugfix/issue-description`.
3. **Local Testing**: Run the frontend using a local HTTP server and the backend using Uvicorn. Verify both.

## 2. Code Review Checklist
Before submitting a Pull Request, ensure:
- [ ] No `console.log` or debug statements remain in the frontend.
- [ ] You have strictly adhered to the Service/Repository separation of concerns in the backend.
- [ ] Database schema changes (if any) are accompanied by a valid Alembic migration file.
- [ ] API endpoints return the standard `{success, message, data, errors}` response wrapper.
- [ ] The `API_MODE` toggle works seamlessly (your feature degrades gracefully or throws a clean error if offline).

## 3. Reporting Issues
Use GitHub issues. Please include:
- A clear description of the bug.
- Steps to reproduce.
- Expected vs. Actual behavior.
- The `ErrID` if the backend threw a 500 exception.
