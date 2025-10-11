-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: onlinefooddb
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `chi_tiet_don_hang`
--

DROP TABLE IF EXISTS `chi_tiet_don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_don_hang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_don_hang` bigint DEFAULT NULL,
  `id_mon_an` bigint DEFAULT NULL,
  `so_luong` int DEFAULT NULL,
  `don_gia` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_don_hang` (`id_don_hang`),
  KEY `id_mon_an` (`id_mon_an`),
  CONSTRAINT `chi_tiet_don_hang_ibfk_1` FOREIGN KEY (`id_don_hang`) REFERENCES `don_hang` (`id`),
  CONSTRAINT `chi_tiet_don_hang_ibfk_2` FOREIGN KEY (`id_mon_an`) REFERENCES `mon_an` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `danh_gia_mon_an`
--

DROP TABLE IF EXISTS `danh_gia_mon_an`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia_mon_an` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` bigint DEFAULT NULL,
  `id_mon_an` bigint DEFAULT NULL,
  `so_sao` int DEFAULT NULL,
  `noi_dung` text,
  `thoi_gian_danh_gia` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  KEY `id_mon_an` (`id_mon_an`),
  CONSTRAINT `danh_gia_mon_an_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`),
  CONSTRAINT `danh_gia_mon_an_ibfk_2` FOREIGN KEY (`id_mon_an`) REFERENCES `mon_an` (`id`),
  CONSTRAINT `danh_gia_mon_an_chk_1` CHECK ((`so_sao` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `danh_gia_nha_hang`
--

DROP TABLE IF EXISTS `danh_gia_nha_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia_nha_hang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` bigint DEFAULT NULL,
  `so_sao` int DEFAULT NULL,
  `noi_dung` text,
  `thoi_gian_danh_gia` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  CONSTRAINT `danh_gia_nha_hang_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`),
  CONSTRAINT `danh_gia_nha_hang_chk_1` CHECK ((`so_sao` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `danh_muc`
--

DROP TABLE IF EXISTS `danh_muc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_muc` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` varchar(100) NOT NULL,
  `mo_ta` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `don_hang`
--

DROP TABLE IF EXISTS `don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `don_hang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` bigint DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` enum('DANG_XU_LY','DANG_LAM','DANG_GIAO','HOAN_THANH','DA_HUY') DEFAULT NULL,
  `id_voucher` bigint DEFAULT NULL,
  `tong_tien` double DEFAULT '500000',
  `dia_chi_giao_hang` varchar(255) DEFAULT NULL,
  `ghi_chu` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  KEY `id_voucher` (`id_voucher`),
  CONSTRAINT `don_hang_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`),
  CONSTRAINT `don_hang_ibfk_2` FOREIGN KEY (`id_voucher`) REFERENCES `voucher` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gio_hang`
--

DROP TABLE IF EXISTS `gio_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gio_hang` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nguoi_dung_id` bigint NOT NULL,
  `mon_an_id` bigint NOT NULL,
  `so_luong` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `nguoi_dung_id` (`nguoi_dung_id`),
  KEY `mon_an_id` (`mon_an_id`),
  CONSTRAINT `gio_hang_ibfk_1` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`),
  CONSTRAINT `gio_hang_ibfk_2` FOREIGN KEY (`mon_an_id`) REFERENCES `mon_an` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hinh_anh_mon_an`
--

DROP TABLE IF EXISTS `hinh_anh_mon_an`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hinh_anh_mon_an` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_mon_an` bigint NOT NULL,
  `duong_dan` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_mon_an` (`id_mon_an`),
  CONSTRAINT `hinh_anh_mon_an_ibfk_1` FOREIGN KEY (`id_mon_an`) REFERENCES `mon_an` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hoa_don`
--

DROP TABLE IF EXISTS `hoa_don`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hoa_don` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `id_don_hang` bigint DEFAULT NULL,
  `ho_ten` varchar(255) DEFAULT NULL,
  `dia_chi` varchar(255) DEFAULT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `thoi_gian_thanh_toan` datetime DEFAULT NULL,
  `tong_tien` double DEFAULT NULL,
  `phuong_thuc` varchar(50) DEFAULT NULL,
  `ma_gd` varchar(100) DEFAULT NULL,
  `trang_thai` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_don_hang` (`id_don_hang`),
  CONSTRAINT `hoa_don_ibfk_1` FOREIGN KEY (`id_don_hang`) REFERENCES `don_hang` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hoi_thoai`
--

DROP TABLE IF EXISTS `hoi_thoai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hoi_thoai` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `khach_hang_id` bigint NOT NULL,
  `thoi_gian_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `khach_hang_id` (`khach_hang_id`),
  CONSTRAINT `hoi_thoai_ibfk_1` FOREIGN KEY (`khach_hang_id`) REFERENCES `nguoi_dung` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `khuyen_mai`
--

DROP TABLE IF EXISTS `khuyen_mai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khuyen_mai` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `mon_an_id` bigint NOT NULL,
  `gia_giam` double NOT NULL,
  `thoi_han` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_mon_an_km` (`mon_an_id`),
  CONSTRAINT `fk_mon_an_km` FOREIGN KEY (`mon_an_id`) REFERENCES `mon_an` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mon_an`
--

DROP TABLE IF EXISTS `mon_an`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mon_an` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ten_mon_an` varchar(100) NOT NULL,
  `mo_ta` text,
  `gia` double NOT NULL,
  `id_danh_muc` bigint DEFAULT NULL,
  `trang_thai` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `id_danh_muc` (`id_danh_muc`),
  CONSTRAINT `mon_an_ibfk_1` FOREIGN KEY (`id_danh_muc`) REFERENCES `danh_muc` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nguoi_dung` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ho_ten` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `dia_chi` varchar(255) DEFAULT NULL,
  `vai_tro` enum('ADMIN','QUANLY','NHANVIEN_QUANLYDONHANG','NHANVIEN_QUANLYMONAN','KHACHHANG') DEFAULT NULL,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `username_2` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tin_nhan`
--

DROP TABLE IF EXISTS `tin_nhan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tin_nhan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hoi_thoai_id` bigint NOT NULL,
  `nguoi_gui_id` bigint NOT NULL,
  `vai_tro_nguoi_gui` enum('ADMIN','QUANLY','NHANVIEN_QUANLYDONHANG','NHANVIEN_QUANLYMONAN','KHACHHANG') NOT NULL,
  `noi_dung` text NOT NULL,
  `thoi_gian_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hoi_thoai_id` (`hoi_thoai_id`),
  CONSTRAINT `tin_nhan_ibfk_1` FOREIGN KEY (`hoi_thoai_id`) REFERENCES `hoi_thoai` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voucher`
--

DROP TABLE IF EXISTS `voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ma_voucher` varchar(50) NOT NULL,
  `loai` enum('PHAN_TRAM','TIEN_MAT') NOT NULL,
  `gia_tri` double NOT NULL,
  `han_su_dung` date NOT NULL,
  `so_luong` int NOT NULL DEFAULT '0',
  `mo_ta` text,
  `da_su_dung` int DEFAULT '0',
  `gia_toi_thieu` int NOT NULL DEFAULT '0',
  `trang_thai` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-21 17:42:31


INSERT INTO `nguoi_dung` (
    `ho_ten`, `email`, `username`, `mat_khau`, `so_dien_thoai`, `dia_chi`, `vai_tro`, `ngay_tao`, `trang_thai`
) VALUES (
    'Admin Hệ Thống',
    'admin@example.com',
    'admin',
    '$2a$10$Dow1FfQUS0Yp3aA0E6d0DOhMPmxjSPdZRhqUWLWyd4InENcy9XUG6',
    '0123456789',
    'Hà Nội',
    'ADMIN',
    NOW(),
    1
);

