-- phpMyAdmin SQL Dump
-- version 3.5.8.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Sep 26, 2014 at 11:11 AM
-- Server version: 5.5.36-cll-lve
-- PHP Version: 5.3.29

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `bedien01_main`
--

-- --------------------------------------------------------

--
-- Table structure for table `remotestorage`
--

CREATE TABLE IF NOT EXISTS `remotestorage` (
  `username` varchar(160) NOT NULL,
  `server` varchar(128) NOT NULL,
  `key` varchar(255) NOT NULL,
  `data` blob,
  PRIMARY KEY (`username`,`server`,`key`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
