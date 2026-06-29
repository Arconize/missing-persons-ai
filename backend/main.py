"""
FindMe - Missing Persons AI System
Full-featured backend: Auth, RBAC, Submission, Search, Admin Panel, Security
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, func
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
import shutil, os, hashlib, secrets, datetime, json

# ─── Database ────────────────────────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = "sqlite:///./missing_persons.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─── Models ──────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String, unique=True, index=True)
    email         = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role          = Column(String, default="user")   # "user" | "admin"
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)

class Session_(Base):
    __tablename__ = "sessions"
    id         = Column(Integer, primary_key=True, index=True)
    token      = Column(String, unique=True, index=True)
    user_id    = Column(Integer)
    expires_at = Column(DateTime)

class Person(Base):
    __tablename__ = "persons"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, index=True)
    status        = Column(String, default="missing")   # missing | found
    description   = Column(Text)
    image_path    = Column(String)
    age           = Column(Integer, nullable=True)
    height        = Column(String, nullable=True)
    national_code = Column(String, nullable=True)
    last_location = Column(String, nullable=True)
    contact_info  = Column(String, nullable=True)
    submitted_by  = Column(Integer, nullable=True)     # user_id
    approved      = Column(Boolean, default=False)     # admin must approve
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)
    notes         = Column(Text, nullable=True)        # admin notes

Base.metadata.create_all(bind=engine)

# ─── Seed default admin ───────────────────────────────────────────────────────
def _hash(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def seed_admin():
    db = SessionLocal()
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(username="admin", email="admin@findme.ir",
                    password_hash=_hash("admin1234"), role="admin"))
        db.commit()
    db.close()

seed_admin()

# ─── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(title="FindMe - Missing Persons AI System", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("images", exist_ok=True)

security = HTTPBearer(auto_error=False)

# ─── Auth Helpers ─────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_session(user_id: int, db: Session) -> str:
    token = secrets.token_hex(32)
    expires = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    db.add(Session_(token=token, user_id=user_id, expires_at=expires))
    db.commit()
    return token

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    sess = db.query(Session_).filter(Session_.token == token).first()
    if not sess or sess.expires_at < datetime.datetime.utcnow():
        return None
    return db.query(User).filter(User.id == sess.user_id).first()

def require_auth(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="احراز هویت الزامی است")
    return current_user

def require_admin(current_user: Optional[User] = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="احراز هویت الزامی است")
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="دسترسی مدیر الزامی است")
    return current_user

# ═══════════════════════════════════════════════════════════════════
#  P.3.1  Registration & Authentication
# ═══════════════════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/auth/register")
def auth_register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(400, "نام کاربری قبلاً استفاده شده است")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "ایمیل قبلاً ثبت شده است")
    user = User(username=req.username, email=req.email,
                password_hash=_hash(req.password), role="user")
    db.add(user); db.commit(); db.refresh(user)
    token = create_session(user.id, db)
    return {"message": "ثبت‌نام موفق", "token": token,
            "user": {"id": user.id, "username": user.username, "role": user.role}}

@app.post("/auth/login")
def auth_login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == req.username).first()
    if not user or user.password_hash != _hash(req.password):
        raise HTTPException(401, "نام کاربری یا رمز عبور اشتباه است")
    if not user.is_active:
        raise HTTPException(403, "حساب کاربری غیرفعال است")
    token = create_session(user.id, db)
    return {"message": "ورود موفق", "token": token,
            "user": {"id": user.id, "username": user.username, "role": user.role}}

@app.post("/auth/logout")
def auth_logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    if credentials:
        db.query(Session_).filter(Session_.token == credentials.credentials).delete()
        db.commit()
    return {"message": "خروج موفق"}

@app.get("/auth/me")
def auth_me(current_user: User = Depends(require_auth)):
    return {"id": current_user.id, "username": current_user.username,
            "email": current_user.email, "role": current_user.role,
            "created_at": current_user.created_at}

# ═══════════════════════════════════════════════════════════════════
#  P.3.2 / P.4.2  Information Submission Form
# ═══════════════════════════════════════════════════════════════════

@app.post("/persons/submit")
async def submit_person(
    name: str = Form(...),
    status: str = Form("missing"),
    description: str = Form(""),
    age: Optional[int] = Form(None),
    height: Optional[str] = Form(None),
    national_code: Optional[str] = Form(None),
    last_location: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    image: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save image
    ext = os.path.splitext(image.filename)[1]
    fname = f"images/{secrets.token_hex(8)}{ext}"
    with open(fname, "wb") as buf:
        shutil.copyfileobj(image.file, buf)

    # Admins are auto-approved
    auto_approve = current_user and current_user.role == "admin"
    person = Person(
        name=name, status=status, description=description,
        image_path=fname, age=age, height=height,
        national_code=national_code, last_location=last_location,
        contact_info=contact_info,
        submitted_by=current_user.id if current_user else None,
        approved=auto_approve
    )
    db.add(person); db.commit(); db.refresh(person)
    return {"id": person.id, "name": name,
            "approved": person.approved,
            "message": "گزارش با موفقیت ثبت شد" + (" و تأیید گردید" if auto_approve else " و در انتظار تأیید است")}

# ═══════════════════════════════════════════════════════════════════
#  P.3.3 / P.4.3  Search & Filtering  (metadata only - no DeepFace dep)
# ═══════════════════════════════════════════════════════════════════

@app.get("/persons/search")
def search_persons(
    name: Optional[str] = None,
    status: Optional[str] = None,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    last_location: Optional[str] = None,
    national_code: Optional[str] = None,
    height: Optional[str] = None,
    page: int = 1,
    limit: int = 12,
    db: Session = Depends(get_db)
):
    q = db.query(Person).filter(Person.approved == True)
    if name:         q = q.filter(Person.name.contains(name))
    if status:       q = q.filter(Person.status == status)
    if age_min:      q = q.filter(Person.age >= age_min)
    if age_max:      q = q.filter(Person.age <= age_max)
    if last_location: q = q.filter(Person.last_location.contains(last_location))
    if national_code: q = q.filter(Person.national_code == national_code)
    if height:       q = q.filter(Person.height.contains(height))

    total = q.count()
    persons = q.order_by(Person.created_at.desc()).offset((page-1)*limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "results": [_serialize(p) for p in persons]
    }

@app.post("/persons/match-face")
async def match_face(
    image: UploadFile = File(...),
    age: Optional[int] = Form(None),
    height: Optional[str] = Form(None),
    national_code: Optional[str] = Form(None),
    last_location: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """AI face matching endpoint — uses DeepFace (same as original)."""
    try:
        from deepface import DeepFace
    except ImportError:
        raise HTTPException(500, "DeepFace not installed")

    temp_path = f"images/temp_{secrets.token_hex(6)}{os.path.splitext(image.filename)[1]}"
    with open(temp_path, "wb") as buf:
        shutil.copyfileobj(image.file, buf)

    try:
        dfs = DeepFace.find(img_path=temp_path, db_path="images",
                            model_name="VGG-Face", enforce_detection=False)
        if len(dfs) > 0 and not dfs[0].empty:
            matched_paths = dfs[0]['identity'].tolist()
            q = db.query(Person).filter(
                Person.approved == True,
                Person.image_path.in_(matched_paths)
            )
            if age is not None:      q = q.filter(Person.age == age)
            if height is not None:   q = q.filter(Person.height == height)
            if national_code:        q = q.filter(Person.national_code == national_code)
            if last_location:        q = q.filter(Person.last_location.contains(last_location))
            persons = q.all()
            os.remove(temp_path)
            return {"matches": [_serialize(p) for p in persons],
                    "message": f"{len(persons)} نفر یافت شد"}
        os.remove(temp_path)
        return {"matches": [], "message": "هیچ تطابقی یافت نشد"}
    except Exception as e:
        if os.path.exists(temp_path): os.remove(temp_path)
        raise HTTPException(500, f"AI Error: {str(e)}")

# ═══════════════════════════════════════════════════════════════════
#  P.4.1  Main Display / Showcase
# ═══════════════════════════════════════════════════════════════════

@app.get("/persons/")
def list_persons(
    page: int = 1, limit: int = 12,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Person).filter(Person.approved == True)
    if status: q = q.filter(Person.status == status)
    total = q.count()
    persons = q.order_by(Person.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return {"total": total, "page": page,
            "pages": (total + limit - 1) // limit,
            "results": [_serialize(p) for p in persons]}

@app.get("/persons/{person_id}")
def get_person(person_id: int, db: Session = Depends(get_db)):
    p = db.query(Person).filter(Person.id == person_id, Person.approved == True).first()
    if not p: raise HTTPException(404, "پرونده یافت نشد")
    return _serialize(p)

# ═══════════════════════════════════════════════════════════════════
#  P.3.4  Admin Control Panel
# ═══════════════════════════════════════════════════════════════════

@app.get("/admin/stats")
def admin_stats(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total       = db.query(Person).count()
    pending     = db.query(Person).filter(Person.approved == False).count()
    approved    = db.query(Person).filter(Person.approved == True).count()
    missing_cnt = db.query(Person).filter(Person.status == "missing", Person.approved == True).count()
    found_cnt   = db.query(Person).filter(Person.status == "found",   Person.approved == True).count()
    users_cnt   = db.query(User).filter(User.role == "user").count()
    return {"total": total, "pending": pending, "approved": approved,
            "missing": missing_cnt, "found": found_cnt, "users": users_cnt}

@app.get("/admin/pending")
def admin_pending(
    page: int = 1, limit: int = 20,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Person).filter(Person.approved == False)
    total = q.count()
    persons = q.order_by(Person.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return {"total": total, "results": [_serialize(p) for p in persons]}

@app.post("/admin/approve/{person_id}")
def admin_approve(
    person_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    p = db.query(Person).filter(Person.id == person_id).first()
    if not p: raise HTTPException(404, "پرونده یافت نشد")
    p.approved = True
    db.commit()
    return {"message": f"پرونده {p.name} تأیید شد"}

@app.post("/admin/reject/{person_id}")
def admin_reject(
    person_id: int,
    notes: Optional[str] = Form(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    p = db.query(Person).filter(Person.id == person_id).first()
    if not p: raise HTTPException(404, "پرونده یافت نشد")
    if notes: p.notes = notes
    db.delete(p); db.commit()
    return {"message": "پرونده رد شد"}

@app.delete("/admin/persons/{person_id}")
def admin_delete(
    person_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    p = db.query(Person).filter(Person.id == person_id).first()
    if not p: raise HTTPException(404, "پرونده یافت نشد")
    if p.image_path and os.path.exists(p.image_path):
        os.remove(p.image_path)
    db.delete(p); db.commit()
    return {"message": "پرونده حذف شد"}

@app.patch("/admin/persons/{person_id}/status")
def admin_update_status(
    person_id: int,
    new_status: str = Form(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    p = db.query(Person).filter(Person.id == person_id).first()
    if not p: raise HTTPException(404)
    p.status = new_status; db.commit()
    return {"message": "وضعیت به‌روز شد"}

@app.get("/admin/users")
def admin_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "email": u.email,
             "role": u.role, "is_active": u.is_active,
             "created_at": u.created_at} for u in users]

@app.patch("/admin/users/{user_id}/toggle")
def admin_toggle_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u: raise HTTPException(404)
    if u.id == current_user.id: raise HTTPException(400, "نمی‌توانید حساب خود را غیرفعال کنید")
    u.is_active = not u.is_active; db.commit()
    return {"message": "وضعیت کاربر تغییر کرد", "is_active": u.is_active}

@app.patch("/admin/users/{user_id}/role")
def admin_set_role(
    user_id: int,
    role: str = Form(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if role not in ("user", "admin"):
        raise HTTPException(400, "نقش نامعتبر است")
    u = db.query(User).filter(User.id == user_id).first()
    if not u: raise HTTPException(404)
    u.role = role; db.commit()
    return {"message": f"نقش {u.username} به {role} تغییر یافت"}

# ─── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "FindMe API v2 is running", "docs": "/docs"}

# ─── Helpers ──────────────────────────────────────────────────────────────────
def _serialize(p: Person) -> dict:
    return {
        "id": p.id, "name": p.name, "status": p.status,
        "description": p.description, "image_path": p.image_path,
        "age": p.age, "height": p.height, "national_code": p.national_code,
        "last_location": p.last_location, "contact_info": p.contact_info,
        "approved": p.approved, "submitted_by": p.submitted_by,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "notes": p.notes
    }

# ─── Static files ─────────────────────────────────────────────────────────────
app.mount("/images", StaticFiles(directory="images"), name="images")
